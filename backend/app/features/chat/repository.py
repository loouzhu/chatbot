from app.db.session import get_db
from app.features.chat.model import ChatMessage, Conversation
from app.features.chat.service import ChatService
from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

db = Depends(get_db)


class ChatRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # 添加一条Message
    async def add_message(self, message: ChatMessage):
        self.db.add(message)

    # 添加一条对话记录
    async def add_conversation(self, conversation: Conversation):
        self.db.add(conversation)

    # 拿到当前对话的所有message
    async def get_history_messages(
        self,
        conversation_id: str,
    ) -> list[ChatMessage]:
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation_id)
            .order_by(ChatMessage.created_at)
        )
        return list(result.scalars().all())

    async def commit(self):
        await self.db.commit()


async def get_chat_service(db: AsyncSession = db):
    repository = ChatRepository(db)
    return ChatService(repository)
