import uuid
from datetime import datetime, timezone

from app.core.exceptions import (
    NotFoundException,
    UnauthorizedException,
    ValidationException,
)
from app.features.chat.constant import MessageRole
from app.features.chat.llm.base import LLMClient, LLMMessage
from app.features.chat.llm.deepseek import DeepSeekProvider
from app.features.chat.model import Conversation, Message
from app.features.chat.repository import ChatRepository
from app.features.chat.schema import ChatMessage, ChatResponse
from pydantic import BaseModel


class TransformResult(BaseModel):
    chat_message: ChatMessage
    db_message: Message


class ChatService:
    def __init__(self, repository: ChatRepository, client: LLMClient | None = None):
        self.client = client or DeepSeekProvider()
        self.repository = repository

    async def transform_message(
        self, message: str, conversation_id: str, role: MessageRole
    ) -> TransformResult:
        new_content = message.strip()
        #  隐患：之后考虑用户强制要求AI返回为空的情况
        if not new_content:
            raise ValidationException("发送内容不能为空", "EMPTY_CONTENT")
        new_db_message = Message(
            id=str(uuid.uuid4()),
            content=new_content,
            role=role,
            conversation_id=conversation_id,
            created_at=datetime.now(timezone.utc),
        )
        new_chat_message = ChatMessage(
            id=new_db_message.id,
            role=role,
            conversation_id=conversation_id,
            content=new_content,
            created_at=new_db_message.created_at,
        )
        return TransformResult(chat_message=new_chat_message, db_message=new_db_message)

    async def send_message(
        self,
        user_message: str,
        conversation_id: str,
        # user_id: str
    ) -> ChatResponse:
        # conversation = await self.repository.get_conversation_by_id(conversation_id)
        # if not conversation:
        #     raise NotFoundException("未找到对话", "NOT_FOUND")
        # if conversation.user_id != user_id:
        #     raise UnauthorizedException("无权访问该对话", "UNAUTHORIZED")
        new_user_message = await self.transform_message(
            message=user_message, conversation_id=conversation_id, role=MessageRole.USER
        )
        await self.repository.add_message(new_user_message.db_message)
        history = await self.repository.get_history_messages(conversation_id)
        llm_messages = [
            LLMMessage(role=msg.role, content=msg.content) for msg in history
        ]
        # 隐患：考虑使用 async with self.db.begin(): 上下文管理器来显式管理事务，这样任何异常都会自动回滚。
        new_ai_content = await self.client.chat(llm_messages)
        new_ai_message = await self.transform_message(
            message=new_ai_content,
            conversation_id=conversation_id,
            role=MessageRole.ASSISTANT,
        )
        await self.repository.add_message(new_ai_message.db_message)
        res = ChatResponse(
            conversation_id=conversation_id,
            user_message=new_user_message.chat_message,
            assistant_message=new_ai_message.chat_message,
        )
        return res

    async def start_new_chat(self, user_id: str) -> Conversation:
        conversation = Conversation(
            id=str(uuid.uuid4()),
            user_id=user_id,
        )
        await self.repository.add_conversation(conversation)
        return conversation
