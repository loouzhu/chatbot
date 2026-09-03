import enum
from datetime import datetime

from pydantic import BaseModel, Field


class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"


class ChatRequest(BaseModel):
    conversation_id: str
    content: str = Field(
        min_length=1,
        max_length=1000,
    )


# 消息模型
class Message(BaseModel):
    id: str
    role: MessageRole
    conversation_id: str
    content: str
    created_at: datetime


#  单轮用户-AI对话模型
class ChatResponse(BaseModel):
    conversation_id: str
    user_message: Message
    assistant_message: Message
