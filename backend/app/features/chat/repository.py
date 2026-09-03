from app.db.session import get_db
from app.features.chat.model import Conversation, Message
from app.features.chat.service import ChatService
from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class ChatRepository:
    def __init__(self, db: AsyncSession = Depends(get_db)):
        self.db = db

    # 添加一条Message
    async def add_message(self, message: Message):
        self.db.add(message)
        await self.db.commit()

    # 添加一条对话记录
    async def add_conversation(self, conversation: Conversation):
        self.db.add(conversation)
        await self.db.commit()

    # 获取当前对话
    async def get_conversation_by_id(self, conversation_id: str) -> Conversation | None:
        query = select(Conversation).where(Conversation.id == conversation_id)
        res = await self.db.execute(query)
        return res.scalar_one_or_none()

    # 拿到当前对话的所有message
    async def get_history_messages(
        self,
        conversation_id: str,
    ) -> list[Message]:
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        )
        return list(result.scalars().all())


async def get_chat_service(db: AsyncSession = Depends(get_db)):
    repository = ChatRepository(db)
    return ChatService(repository)
