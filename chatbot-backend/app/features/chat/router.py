from app.features.chat.schema import ChatRequest, ChatResponse
from app.features.chat.service import ChatService
from app.integrations.deepseek.client import DeepSeekClient, DeepSeekError
from fastapi import APIRouter, HTTPException

chat_router = APIRouter(prefix="/chat", tags=["Chat"])

chat_service = ChatService(DeepSeekClient())


@chat_router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    try:
        response = await chat_service.send_message(request.user_message)
        return ChatResponse(response=response)
    except DeepSeekError as exc:
        raise HTTPException(status_code=502, detail="AI服务暂不可用") from exc
