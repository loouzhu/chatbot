from datetime import datetime

from app.core.exceptions import ValidationException
from app.features.chat.constant import MessageRole
from pydantic import BaseModel, Field, field_validator


# 输入消息模型
class MessageRequest(BaseModel):
    conversation_id: str
    content: str = Field(min_length=1, max_length=1000)

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValidationException("消息内容不能为空", "EMPTY_CONTENT")
        return value


# 输出消息模型
class MessageResponse(BaseModel):
    id: str
    role: MessageRole
    conversation_id: str
    content: str
    created_at: datetime


# 对话模型
class ConversationResponse(BaseModel):
    id: str
    messages: list[MessageResponse]
