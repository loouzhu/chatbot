from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    user_message: str = Field(
        min_length=1,
        max_length=10_000,
        description="用户发送的聊天内容",
    )


class ChatResponse(BaseModel):
    response: str
