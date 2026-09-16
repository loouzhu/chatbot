from app.db.session import get_db
from app.features.chat.model import Conversation, Message
from fastapi import Depends
from sqlalchemy import delete, select, update
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

    # 获取对话的历史记录列表
    async def get_history_conversations(self, user_id: str):
        result = await self.db.execute(
            select(Conversation.id, Conversation.title, Conversation.created_at)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at)
        )
        return list(result.scalars().all())

    # 删除一条对话历史记录
    async def delete_conversation(self, conversation_id: str):
        result = await self.db.execute(
            delete(Conversation).where(Conversation.id == conversation_id)
        )
        await self.db.commit()
        return result.rowcount > 0  # type: ignore

    # 设置当前对话标题
    async def set_title(self, conversation_id: str, title: str):
        result = await self.db.execute(
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(title=title)
        )
        await self.db.commit()
        return result.rowcount > 0  # type: ignore
