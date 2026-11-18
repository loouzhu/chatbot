import asyncio
from collections.abc import AsyncIterator
from contextlib import aclosing
from typing import TYPE_CHECKING
from uuid import uuid4

from app.core.exceptions import AppException
from app.features.chat.constant import MessageRole, MessageStatus
from app.features.chat.context import valid_context_with_window
from app.features.chat.llm_events import (
    Completed,
    Delta,
    Failed,
    GenerationError,
    stream_llm_events,
)
from app.features.chat.message_lifecycle import (
    MessageLifecycle,
    created_event,
    generating_event,
    to_db_message,
    to_message_response,
)
from app.features.chat.model import Conversation
from app.features.chat.schema import (
    ContextInfo,
    ConversationResponse,
    HistoryConversationResponse,
    StreamResponse,
    UpstreamStreamInterrupted,
)
from app.integrations.llm.base import LLMClient, LLMException
from app.integrations.llm.deepseek.client import DeepSeekProvider
from app.integrations.llm.deepseek.deepseek_v4_tokenizer.deepseek_tokenizer import (
    get_input_token,
)

if TYPE_CHECKING:
    from app.features.chat.repository import ChatRepository

from app.features.chat.generation_registry import generation_registry


class ChatService:
    def __init__(self, repository: "ChatRepository", client: LLMClient | None = None):
        self.client = client or DeepSeekProvider()
        self.repository = repository

    async def stream_message(
        self,
        new_user_content: str,
        conversation_id: str,
        user_id: str,
    ) -> AsyncIterator[StreamResponse]:
        context_info = await self._prepare_messages(
            new_user_content=new_user_content,
            conversation_id=conversation_id,
            user_id=user_id,
        )

        lifecycle = MessageLifecycle(self.repository)
        message = await lifecycle.create(conversation_id)
        message_id = message.id
        task = asyncio.current_task()
        if task is None:
            raise RuntimeError("当前没有正在运行的 asyncio 任务")
        generation_registry.register_task(message_id, task)
        full_content = message.content
        try:
            yield created_event(message)
            generation_started = False
            async with aclosing(
                stream_llm_events(self.client, context_info.messages)
            ) as events:
                async for event in events:
                    if isinstance(event, Delta):
                        full_content += event.text
                        if not generation_started:
                            message = await lifecycle.start_generating(
                                message, full_content
                            )
                            generation_started = True
                        yield generating_event(event.text)
                    elif isinstance(event, Failed):
                        yield await lifecycle.fail(
                            message, full_content, event.code, event.message
                        )
                        return
                    elif isinstance(event, Completed):
                        yield await lifecycle.complete(
                            message, full_content, event.usage
                        )
                        return

            raise UpstreamStreamInterrupted()
        except asyncio.CancelledError:
            await lifecycle.cancel(message, full_content)
            raise
        except GenerationError as error:
            yield await lifecycle.fail(
                message, full_content, error.code, error.message
            )
        except UpstreamStreamInterrupted:
            yield await lifecycle.fail(
                message,
                full_content,
                "UPSTREAM_STREAM_INTERRUPTED",
                "回答生成中断",
            )
        except Exception:  # noqa: BLE001
            yield await lifecycle.fail(
                message,
                full_content,
                "INTERNAL_ERROR",
                "生成失败，请稍后重试",
            )
        finally:
            generation_registry.unregister_task(message_id, task)

    async def _prepare_messages(
        self,
        new_user_content: str,
        conversation_id: str,
        user_id: str,
    ) -> ContextInfo:
        conversation = await self.repository.get_conversation_by_id(conversation_id)
        if not conversation:
            raise AppException("没有找到该对话", "NOTFOUND", 404)
        if conversation.user_id != user_id:
            raise AppException("无权访问该对话", "UNAUTHORIZED", 403)
        new_db_user_message = to_db_message(
            content=new_user_content,
            status=MessageStatus.COMPLETED,
            conversation_id=conversation_id,
            role=MessageRole.USER,
        )
        token_limit = self.client.context_window - self.client.max_output_len
        if get_input_token(new_user_content) > token_limit:
            raise LLMException(
                message="输入长度超过上下文限制",
                code="OUT OF LIMIT",
                model_name=self.client.model,
                status_code=422,
            )
        history = await self.repository.get_history_messages(conversation_id)
        if not history:
            await self.repository.set_title(
                title=new_user_content[:20], conversation_id=conversation.id
            )
        await self.repository.add_message(new_db_user_message)
        history = await self.repository.get_history_messages(
            conversation_id=conversation_id, order="desc"
        )
        context_info = valid_context_with_window(
            messages=history,
            contextWindow=token_limit,
        )
        return context_info

    async def start_new_chat(self, user_id: str) -> ConversationResponse:
        conversation = Conversation(id=str(uuid4()), user_id=user_id, title="新对话")
        await self.repository.add_conversation(conversation)
        return ConversationResponse(
            id=conversation.id,
            messages=[],
        )

    async def get_all_history_conversations(
        self, user_id: str
    ) -> list[HistoryConversationResponse]:
        return await self.repository.get_all_history_conversations(user_id)

    async def get_single_conversation_history(
        self, user_id: str, conversation_id: str
    ) -> ConversationResponse | None:
        conversation = await self.repository.get_conversation_by_id(conversation_id)
        if not conversation:
            raise AppException("未找到对话", "NOT_FOUND", 404)
        if conversation.user_id != user_id:
            raise AppException("无权访问该对话", "UNAUTHORIZED", 401)
        db_messages = await self.repository.get_history_messages(conversation_id)
        return ConversationResponse(
            id=conversation.id,
            messages=[to_message_response(message) for message in db_messages],
        )

    async def delete_conversation(self, user_id: str, conversation_id: str):
        conversation = await self.repository.get_conversation_by_id(conversation_id)
        if not conversation:
            raise AppException("未找到对话", "NOT_FOUND", 404)
        if conversation.user_id != user_id:
            raise AppException("无权访问该对话", "UNAUTHORIZED", 401)
        return await self.repository.delete_conversation(conversation_id)

    async def stop_request_message(
        self,
        user_id: str,
        message_id: str,
        conversation_id: str,
    ):
        conversation = await self.repository.get_conversation_by_id(conversation_id)
        if not conversation:
            raise AppException("未找到对话", "NOT_FOUND", 404)
        if conversation.user_id != user_id:
            raise AppException("无权访问该对话", "UNAUTHORIZED", 401)
        message = await self.repository.find_message(conversation_id, message_id)
        if not message:
            raise AppException("未找到消息", "NOT_FOUND", 404)
        await generation_registry.cancel_and_wait(message_id)
