from datetime import datetime

from pydantic import BaseModel, Field

from backend.app.features.chat.constant import MessageRole


class ChatRequest(BaseModel):
    conversation_id: str
    content: str = Field(
        min_length=1,
        max_length=1000,
    )


# 消息模型
class ChatMessage(BaseModel):
    id: str
    role: MessageRole
    conversation_id: str
    content: str
    created_at: datetime


#  单轮用户-AI对话模型
class ChatResponse(BaseModel):
    conversation_id: str
    user_message: ChatMessage
    assistant_message: ChatMessage
