from datetime import datetime, timezone
from typing import TYPE_CHECKING
from uuid import uuid4

from app.core.exceptions import (
    NotFoundException,
    UnauthorizedException,
    ValidationException,
)
from app.features.chat.constant import MessageRole
from app.features.chat.llm.base import LLMClient, LLMMessage
from app.features.chat.llm.deepseek import DeepSeekProvider
from app.features.chat.model import Conversation
from app.features.chat.repository import to_db_message
from app.features.chat.schema import ConversationResponse, MessageResponse

if TYPE_CHECKING:
    from app.features.chat.repository import ChatRepository


class ChatService:
    def __init__(self, repository: "ChatRepository", client: LLMClient | None = None):
        self.client = client or DeepSeekProvider()
        self.repository = repository

    async def send_message(
        self,
        new_user_content: str,
        conversation_id: str,
        # user_id: str
    ) -> MessageResponse:
        # conversation = await self.repository.get_conversation_by_id(conversation_id)
        # if not conversation:
        #     raise NotFoundException("未找到对话", "NOT_FOUND")
        # if conversation.user_id != user_id:
        #     raise UnauthorizedException("无权访问该对话", "UNAUTHORIZED")
        # if not conversation_id:
        #     self.start_new_chat(user_id=user_id)
        new_db_user_message = to_db_message(
            content=new_user_content,
            conversation_id=conversation_id,
            role=MessageRole.USER,
        )
        await self.repository.add_message(new_db_user_message)
        history = await self.repository.get_history_messages(conversation_id)
        llm_messages = [
            LLMMessage(role=msg.role, content=msg.content) for msg in history
        ]
        # 隐患：考虑使用 async with self.db.begin(): 上下文管理器来显式管理事务，这样任何异常都会自动回滚。
        new_ai_content = await self.client.chat(llm_messages)
        new_db_ai_message = to_db_message(
            content=new_ai_content,
            conversation_id=conversation_id,
            role=MessageRole.ASSISTANT,
        )
        await self.repository.add_message(new_db_ai_message)
        return MessageResponse(
            id=new_db_ai_message.id,
            role=new_db_ai_message.role,
            content=new_db_ai_message.content,
            conversation_id=new_db_ai_message.conversation_id,
            created_at=new_db_ai_message.created_at,
        )

    async def start_new_chat(self, user_id: str) -> ConversationResponse:
        conversation = Conversation(
            id=str(uuid4()),
            user_id=user_id,
        )
        await self.repository.add_conversation(conversation)
        return ConversationResponse(
            id=conversation.id,
            messages=[],
        )


# async def transform_message(
#     message: str, conversation_id: str, role: MessageRole
# ) -> ChatMessage:
#     new_content = message.strip()
#     #  隐患：之后考虑用户强制要求AI返回为空的情况
#     if not new_content:
#         raise ValidationException("发送内容不能为空", "EMPTY_CONTENT")
#     new_chat_message = ChatMessage(
#         id=str(uuid4()),
#         role=role,
#         conversation_id=conversation_id,
#         content=new_content,
#         created_at=new_db_message.created_at,
#     )
