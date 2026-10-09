import uuid
from collections.abc import AsyncIterator
from typing import TYPE_CHECKING
from uuid import uuid4

from app.core.exceptions import AppException
from app.features.chat.constant import MessageRole, MessageType
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
)
from app.integrations.llm.base import LLMClient, LLMException
from app.integrations.llm.deepseek.client import DeepSeekProvider
from app.integrations.llm.deepseek.deepseek_v4_tokenizer.deepseek_tokenizer import (
    get_input_token,
)
from openai.types.responses import ResponseErrorEvent, ResponseUsage

if TYPE_CHECKING:
    from app.features.chat.repository import ChatRepository


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
            status=MessageType.CREATED,
            role=MessageRole.ASSISTANT,
        )
        new_db_ai_message = await self.repository.add_message(new_db_ai_message)

        yield StreamResponse(
            type=MessageType.CREATED,
            data=to_stream_created_data(
                new_db_ai_message.id,
                new_db_ai_message.role,
            ),
        )

        full_content = new_db_ai_message.content
        async for chunk in self.client.stream_chat(context_info.messages):
            if chunk.type == "response.output_text.delta":
                full_content += chunk.delta
                yield StreamResponse(
                    type=MessageType.GENERATING,
                    data=to_stream_generate_data(chunk.delta),
                )
            elif chunk.type == "error":
                failed_data = to_stream_failed_data(new_db_ai_message, chunk)
                new_db_ai_message.content = failed_data.message.content
                new_db_ai_message.status = MessageType.FAILED
                new_db_ai_message.error_code = failed_data.error.error_code
                new_db_ai_message.error_message = failed_data.error.error_message
                await self.repository.update_message(
                    new_db_ai_message,
                )
                yield StreamResponse(
                    type=MessageType.FAILED,
                    data=failed_data,
                )
                return
            elif chunk.type == "response.completed":
                usage = chunk.response.usage
                new_db_ai_message.content = full_content
                new_db_ai_message.status = MessageType.COMPLETED
                new_db_ai_message.input_tokens = usage.input_tokens if usage else None
                new_db_ai_message.output_tokens = usage.output_tokens if usage else None
                new_db_ai_message.total_tokens = usage.total_tokens if usage else None
                await self.repository.update_message(new_db_ai_message)
                yield StreamResponse(
                    type=MessageType.COMPLETED,
                    data=to_stream_done_data(new_db_ai_message, usage),
                )

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
            status=MessageType.COMPLETED,
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


def to_db_message(
    content: str, conversation_id: str, status: MessageType, role: MessageRole
) -> Message:
    return Message(
        id=str(uuid.uuid4()),
        content=content,
        status=status,
        conversation_id=conversation_id,
        role=role,
    )


def to_message_response(message: Message) -> MessageResponse:
    return MessageResponse(
        id=message.id,
        role=message.role,
        content=message.content,
        created_at=message.created_at,
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
            error_code=chunk.code or "UNKNOWN ERROR", error_message=chunk.message
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
