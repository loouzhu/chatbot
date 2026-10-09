from datetime import datetime
from typing import Optional

from app.core.exceptions import AppException
from app.features.chat.constant import MessageRole, MessageType
from app.integrations.llm.base import LLMMessage
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
    created_at: datetime


# 输入token详情
class InputTokensDetails(BaseModel):
    cached_tokens: int


# 输出token详情
class OutputTokensDetails(BaseModel):
    reasoning_tokens: int


# token使用量模型
class TokenUsage(BaseModel):
    input_tokens: int
    input_tokens_details: Optional[InputTokensDetails] = None
    output_tokens: int
    output_tokens_details: Optional[OutputTokensDetails] = None
    total_tokens: int


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
    usage: Optional[TokenUsage] = None


# 流式输出失败data
class ErrorInfoResponse(BaseModel):
    error_code: str
    error_message: str


class StreamFailedData(BaseModel):
    message: MessageResponse
    error: ErrorInfoResponse


# 流式输出消息模型
class StreamResponse(BaseModel):
    type: MessageType
    data: StreamCreatedData | StreamGenerateData | StreamDoneData | StreamFailedData


# 对话模型
class ConversationResponse(BaseModel):
    id: str
    messages: list[MessageResponse]


# 历史记录对话模型
class HistoryConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime


# 上下文信息模型
class ContextInfo(BaseModel):
    messages: list[LLMMessage]
    used_token: int
    rest_token: int
