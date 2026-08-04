from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    conversation_id: str = Field(description="当前会话ID")
    user_message: str = Field(
        min_length=1,
        max_length=10000,
        description="用户发送的聊天内容",
    )


class ChatResponse(BaseModel):
    conversation_id: str
    response: str


class ConversationResponse(BaseModel):
    id: str


