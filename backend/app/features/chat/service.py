import asyncio
import logging
from collections.abc import AsyncIterator
from contextlib import aclosing
from typing import TYPE_CHECKING
from uuid import uuid4

from app.core.exceptions import AppException
from app.db.session import SessionLocal
from app.features.chat.constant import MessageRole, MessageStatus
from app.features.chat.context import valid_context, valid_context_with_window
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
from app.features.chat.utils import require_conversation_access
from app.integrations.llm.base import LLMClient, LLMException, LLMMessage
from app.integrations.llm.deepseek.client import DeepSeekProvider
from app.integrations.llm.deepseek.deepseek_v4_tokenizer.deepseek_tokenizer import (
    get_input_token,
)

if TYPE_CHECKING:
    from app.features.chat.repository import ChatRepository

from app.features.chat.generation_registry import generation_registry

logger = logging.getLogger(__name__)
summary_tasks: set[asyncio.Task[None]] = set()
# Cap the trigger so very large configured context windows still get summaries.
SUMMARY_TRIGGER_TOKENS = 8192
SUMMARY_BATCH_TOKENS = 4096


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
        response_completed = False
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
                        completed_event = await lifecycle.complete(
                            message, full_content, event.usage
                        )
                        response_completed = True
                        summary_task = asyncio.create_task(
                            update_summary_in_background(
                                user_id, conversation_id, self.client
                            )
                        )
                        summary_tasks.add(summary_task)
                        summary_task.add_done_callback(summary_tasks.discard)
                        yield completed_event
                        return

            raise UpstreamStreamInterrupted()
        except asyncio.CancelledError:
            if not response_completed:
                await lifecycle.cancel(message, full_content)
            raise
        except GenerationError as error:
            yield await lifecycle.fail(message, full_content, error.code, error.message)
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
        conversation = await require_conversation_access(
            user_id, conversation_id, self.repository
        )
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
        history = await self.repository.get_history_messages(conversation_id)
        summary_message = None
        history_for_context = history
        if conversation.summary and conversation.summarized_through_message_id:
            covered_index = next(
                (
                    index
                    for index, message in enumerate(history)
                    if message.id == conversation.summarized_through_message_id
                ),
                None,
            )
            if covered_index is not None:
                candidate = LLMMessage(
                    role=MessageRole.SYSTEM,
                    content=f"此前对话摘要：\n{conversation.summary}",
                )
                if (
                    get_input_token(candidate.content)
                    + get_input_token(new_user_content)
                    <= token_limit
                ):
                    summary_message = candidate
                    history_for_context = history[covered_index + 1 :]

        summary_tokens = (
            get_input_token(summary_message.content) if summary_message else 0
        )
        context_info = valid_context_with_window(
            messages=list(reversed(history_for_context)),
            contextWindow=token_limit - summary_tokens,
        )
        if summary_message:
            context_info.messages.insert(0, summary_message)
            context_info.used_token += summary_tokens
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
        conversation = await require_conversation_access(
            user_id, conversation_id, self.repository
        )
        db_messages = await self.repository.get_history_messages(conversation_id)
        return ConversationResponse(
            id=conversation.id,
            messages=[to_message_response(message) for message in db_messages],
        )

    async def delete_conversation(self, user_id: str, conversation_id: str):
        await require_conversation_access(user_id, conversation_id, self.repository)
        return await self.repository.delete_conversation(conversation_id)

    async def stop_request_message(
        self,
        user_id: str,
        message_id: str,
        conversation_id: str,
    ):
        await require_conversation_access(user_id, conversation_id, self.repository)
        message = await self.repository.find_message(conversation_id, message_id)
        if not message:
            raise AppException("未找到消息", "NOT_FOUND", 404)
        await generation_registry.cancel_and_wait(message_id)

    async def update_summary(self, user_id: str, conversation_id: str) -> None:
        conversation = await require_conversation_access(
            user_id, conversation_id, self.repository
        )
        messages = await self.repository.get_history_messages(conversation_id)
        covered_index = -1
        if conversation.summarized_through_message_id:
            covered_index = next(
                (
                    index
                    for index, message in enumerate(messages)
                    if message.id == conversation.summarized_through_message_id
                ),
                -1,
            )
            if covered_index < 0:
                logger.warning("摘要覆盖消息不存在: %s", conversation_id)
                return

        pending = []
        for message in messages[covered_index + 1 :]:
            if message.status == MessageStatus.COMPLETED:
                pending.append(message)

        token_limit = self.client.context_window - self.client.max_output_len
        if token_limit <= 0:
            return
        pending_tokens = sum(get_input_token(message.content) for message in pending)
        previous_summary = conversation.summary
        summary_tokens = get_input_token(previous_summary) if previous_summary else 0
        trigger_tokens = min(int(token_limit * 0.7), SUMMARY_TRIGGER_TOKENS)
        if summary_tokens + pending_tokens < trigger_tokens:
            return

        # Keep the latest six completed messages in their original form.
        to_summarize = pending[:-6]
        if not to_summarize:
            return

        expected_id = conversation.summarized_through_message_id
        batch_budget = max(1, min(token_limit // 2, SUMMARY_BATCH_TOKENS))
        batch = []
        batch_tokens = 0
        for message in to_summarize:
            message_tokens = get_input_token(message.content)
            if batch and batch_tokens + message_tokens > batch_budget:
                previous_summary = await self.client.chat_summarize(
                    previous_summary, valid_context(batch)
                )
                through_id = batch[-1].id
                saved = await self.repository.update_summary(
                    conversation_id, previous_summary, through_id, expected_id
                )
                if not saved:
                    return
                expected_id = through_id
                batch = []
                batch_tokens = 0
            batch.append(message)
            batch_tokens += message_tokens

        if batch:
            previous_summary = await self.client.chat_summarize(
                previous_summary, valid_context(batch)
            )
            await self.repository.update_summary(
                conversation_id, previous_summary, batch[-1].id, expected_id
            )


async def update_summary_in_background(
    user_id: str, conversation_id: str, client: LLMClient
) -> None:
    from app.features.chat.repository import ChatRepository

    try:
        async with SessionLocal() as session:
            await ChatService(ChatRepository(session), client).update_summary(
                user_id, conversation_id
            )
    except Exception:
        logger.exception("更新对话摘要失败: %s", conversation_id)
