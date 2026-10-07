from datetime import datetime

from app.core.exceptions import AppException
from app.features.chat.constant import MessageRole, MessageType
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
            raise AppException("消息内容不能为空", "EMPTY_CONTENT", 400)
        return value


# 输出消息模型
class MessageResponse(BaseModel):
    id: str
    role: MessageRole
    content: str
    status: MessageType
    created_at: datetime


# 流式输出创建时data
class StreamCreatedData(BaseModel):
    id: str
    role: MessageRole


# 流式输出生成中data
class StreamGenerateData(BaseModel):
    content: str


# 流式输出结束data
class StreamDoneData(BaseModel):
    message: MessageResponse


# 流式输出消息模型
class StreamResponse(BaseModel):
    type: MessageType
    data: StreamCreatedData | StreamGenerateData | StreamDoneData


# 对话模型
class ConversationResponse(BaseModel):
    id: str
    messages: list[MessageResponse]


# 历史记录对话模型
class HistoryConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
