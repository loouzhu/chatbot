import uuid

from app.core.exceptions import ValidationException
from app.features.chat.llm.base import LLMClient, LLMMessage
from app.features.chat.llm.deepseek import DeepSeekProvider
from app.features.chat.model import ChatMessage, Conversation
from app.features.chat.repository import ChatRepository


class ChatService:
    def __init__(self, repository: ChatRepository, client: LLMClient | None = None):
        self.client = client or DeepSeekProvider()
        self.repository = repository

    async def transform_message(
        self, message: str, conversation_id: str, role: str
    ) -> ChatMessage:
        new_content = message.strip()

        if not new_content:
            raise ValidationException("发送内容不能为空", 400)
        new_message = ChatMessage(
            id=str(uuid.uuid4()),
            content=new_content,
            role=role,
            conversation_id=conversation_id,
        )
        return new_message

    async def send_message(
        self,
        user_message: str,
        conversation_id: str,
    ) -> str:
        new_user_message = await self.transform_message(
            message=user_message, conversation_id=conversation_id, role="user"
        )
        await self.repository.add_message(new_user_message)
        history = await self.repository.get_history_messages(conversation_id)
        llm_messages = [
            LLMMessage(role=msg.role, content=msg.content) for msg in history
        ]
        new_ai_content = await self.client.chat(llm_messages)
        new_ai_message = await self.transform_message(
            message=new_ai_content, conversation_id=conversation_id, role="assistant"
        )
        await self.repository.add_message(new_ai_message)
        await self.repository.commit()
        return new_ai_content

    async def start_new_chat(self, user_id: str) -> Conversation:
        conversation = Conversation(
            id=str(uuid.uuid4()),
            user_id=user_id,
        )
        await self.repository.add_conversation(conversation)
        return conversation
