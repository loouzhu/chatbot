from app.db.session import get_db
from app.features.chat.models import ChatMessages, Conversation
from app.features.chat.service import ChatService
from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class ChatRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def add_message(self, message: ChatMessages):
        self.db.add(message)

    async def add_conversation(self, conversation: Conversation):
        self.db.add(conversation)

    async def get_history_messages(
        self,
        conversation_id: str,
    ) -> list[ChatMessages]:
        result = await self.db.execute(
            select(ChatMessages)
            .where(ChatMessages.conversation_id == conversation_id)
            .order_by(ChatMessages.created_at)
        )
        return list(result.scalars().all())

    async def commit(self):
        await self.db.commit()


async def get_chat_service(db: AsyncSession = Depends(get_db)):
    repository = ChatRepository(db)
    return ChatService(repository)
