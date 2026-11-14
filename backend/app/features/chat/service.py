import asyncio
import uuid
from asyncio.log import logger
from collections.abc import AsyncIterator
from contextlib import aclosing
from typing import TYPE_CHECKING
from uuid import uuid4

from app.core.exceptions import AppException
from app.features.chat.constant import MessageRole, MessageStatus
from app.features.chat.context import valid_context_with_window
from app.features.chat.model import Conversation, Message
from app.features.chat.schema import (
    ContextInfo,
    ConversationResponse,
    ErrorInfoResponse,
    HistoryConversationResponse,
    MessageResponse,
    StreamCreatedData,
    StreamDoneData,
    StreamFailedData,
    StreamGenerateData,
    StreamResponse,
    TokenUsage,
    UpstreamStreamInterrupted,
)
from app.integrations.llm.base import LLMClient, LLMException
from app.integrations.llm.deepseek.client import DeepSeekProvider
from app.integrations.llm.deepseek.deepseek_v4_tokenizer.deepseek_tokenizer import (
    get_input_token,
)
from openai import APIConnectionError, APIStatusError, APITimeoutError
from openai.types.responses import ResponseErrorEvent, ResponseUsage

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

        new_db_ai_message = to_db_message(
            content="",
            conversation_id=conversation_id,
            status=MessageStatus.CREATED,
            role=MessageRole.ASSISTANT,
        )
        new_db_ai_message = await self.repository.add_message(new_db_ai_message)
        message_id = new_db_ai_message.id
        task = asyncio.current_task()
        if task is None:
            raise RuntimeError("当前没有正在运行的 asyncio 任务")
        generation_registry.register_task(message_id, task)
        full_content = new_db_ai_message.content
        try:
            yield StreamResponse(
                type=MessageStatus.CREATED,
                data=to_stream_created_data(
                    message_id,
                    new_db_ai_message.role,
                ),
            )

            terminal_saved = False
            generation_started = False
            async with aclosing(
                self.client.stream_chat(context_info.messages)  # type: ignore
            ) as chunks:
                async for chunk in chunks:
                    if chunk.type == "response.output_text.delta":
                        full_content += chunk.delta
                        if not generation_started:
                            new_db_ai_message = to_db_message(
                                id=message_id,
                                content=full_content,
                                conversation_id=conversation_id,
                                status=MessageStatus.GENERATING,
                                role=MessageRole.ASSISTANT,
                            )
                            new_db_ai_message = await self.repository.update_message(
                                new_db_ai_message
                            )
                            generation_started = True
                        yield StreamResponse(
                            type=MessageStatus.GENERATING,
                            data=to_stream_generate_data(chunk.delta),
                        )
                    elif chunk.type == "error":
                        new_db_ai_message.content = full_content
                        new_db_ai_message.status = MessageStatus.FAILED
                        new_db_ai_message.error_code = chunk.code
                        new_db_ai_message.error_message = chunk.message
                        new_db_ai_message = await self.repository.update_message(
                            new_db_ai_message,
                        )
                        failed_data = to_stream_failed_data(new_db_ai_message, chunk)
                        yield StreamResponse(
                            type=MessageStatus.FAILED,
                            data=failed_data,
                        )
                        return
                    elif chunk.type == "response.completed":
                        usage = chunk.response.usage
                        new_db_ai_message.content = full_content
                        new_db_ai_message.status = MessageStatus.COMPLETED
                        new_db_ai_message.input_tokens = (
                            usage.input_tokens if usage else None
                        )
                        new_db_ai_message.output_tokens = (
                            usage.output_tokens if usage else None
                        )
                        new_db_ai_message.total_tokens = (
                            usage.total_tokens if usage else None
                        )
                        new_db_ai_message = await self.repository.update_message(
                            new_db_ai_message
                        )
                        terminal_saved = True
                        yield StreamResponse(
                            type=MessageStatus.COMPLETED,
                            data=to_stream_done_data(new_db_ai_message, usage),
                        )
                        return

            # 流自然结束后仍未保存终态，说明缺少明确的结束事件。
            if not terminal_saved:
                raise UpstreamStreamInterrupted()
        except asyncio.CancelledError:
            await self.save_cancelled_with_protection(
                id=message_id,
                content=full_content,
                conversation_id=conversation_id,
            )
            raise

        except APITimeoutError:
            event = await self.finish_failed(
                message_id,
                full_content,
                conversation_id,
                "GENERATION_TIMEOUT",
                "生成超时，请重试",
            )
            yield event
            return

        except APIStatusError:
            # 日志记录上游状态码、请求 ID 等
            event = await self.finish_failed(
                message_id,
                full_content,
                conversation_id,
                "UPSTREAM_API_ERROR",
                "模型服务暂时不可用",
            )
            yield event
            return

        except APIConnectionError:
            event = await self.finish_failed(
                message_id,
                full_content,
                conversation_id,
                "UPSTREAM_CONNECTION_ERROR",
                "模型连接中断",
            )
            yield event
            return

        except UpstreamStreamInterrupted:
            event = await self.finish_failed(
                message_id,
                full_content,
                conversation_id,
                "UPSTREAM_STREAM_INTERRUPTED",
                "回答生成中断",
            )
            yield event
            return

        except Exception:  # noqa: BLE001
            event = await self.finish_failed(
                id=message_id,
                content=full_content,
                conversation_id=conversation_id,
                error_code="INTERNAL_ERROR",
                error_message="生成失败，请稍后重试",
            )
            yield event
            return

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

    async def finish_failed(
        self,
        id: str,
        content: str,
        conversation_id: str,
        error_code: str,
        error_message: str,
    ):
        db_ai_message = to_db_message(
            id=id,
            content=content,
            conversation_id=conversation_id,
            status=MessageStatus.FAILED,
            role=MessageRole.ASSISTANT,
            error_code=error_code,
            error_message=error_message,
        )
        updated_message = await self.repository.update_message(db_ai_message)
        message_response = to_message_response(updated_message)
        error_response = ErrorInfoResponse(
            error_code=error_code,
            error_message=error_message,
        )
        return StreamResponse(
            type=MessageStatus.FAILED,
            data=StreamFailedData(message=message_response, error=error_response),
        )

    async def save_cancelled_with_protection(
        self,
        id: str,
        content: str,
        conversation_id: str,
    ):
        new_db_ai_message = to_db_message(
            id=id,
            content=content,
            conversation_id=conversation_id,
            status=MessageStatus.CANCELLED,
            role=MessageRole.ASSISTANT,
        )
        max_tries = 4
        for attempt in range(max_tries):
            try:
                await self.repository.update_message(new_db_ai_message)
                return
            except Exception:
                if attempt == max_tries - 1:
                    logger.exception(f"消息取消状态保存失败，已达到最大重试次数: {id}")
                    raise
                delay = 0.5 * attempt**2
                await asyncio.sleep(delay)

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


def to_db_message(
    content: str,
    conversation_id: str,
    status: MessageStatus,
    role: MessageRole,
    error_message: str = "",
    error_code: str = "",
    id: str = "",
) -> Message:
    return Message(
        id=id if len(id) > 0 else str(uuid.uuid4()),
        content=content,
        status=status,
        conversation_id=conversation_id,
        role=role,
        error_code=error_code,
        error_message=error_message,
    )


def to_message_response(message: Message) -> MessageResponse:
    return MessageResponse(
        id=message.id,
        role=message.role,
        status=message.status,
        content=message.content,
        created_at=message.created_at,
        error_code=message.error_code,
        error_message=message.error_message,
    )


def to_stream_created_data(id: str, role: MessageRole) -> StreamCreatedData:
    return StreamCreatedData(id=id, role=role)


def to_stream_generate_data(content: str) -> StreamGenerateData:
    return StreamGenerateData(content=content)


def to_stream_done_data(
    message: Message, usage: ResponseUsage | None
) -> StreamDoneData:
    token_usage = (
        TokenUsage.model_validate(usage.model_dump()) if usage is not None else None
    )
    return StreamDoneData(message=to_message_response(message), usage=token_usage)


def to_stream_failed_data(
    message: Message, chunk: ResponseErrorEvent
) -> StreamFailedData:
    return StreamFailedData(
        message=to_message_response(message),
        error=ErrorInfoResponse(
            error_code=chunk.code or "UNKNOWN ERROR",
            error_message=chunk.message,
        ),
    )


# async def transform_message(
#     message: str, conversation_id: str, role: MessageRole
# ) -> ChatMessage:
#     new_content = message.strip()
#     #  隐患：之后考虑用户强制要求AI返回为空的情况
#     if not new_content:
#         raise AppException("发送内容不能为空", "EMPTY_CONTENT")
#     new_chat_message = ChatMessage(
#         id=str(uuid4()),
#         role=role,
#         conversation_id=conversation_id,
#         content=new_content,
#         created_at=new_db_message.created_at,
#     )
