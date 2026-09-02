from app.features.chat.llm.deepseek import DeepSeekError
from app.features.chat.repository import get_chat_service
from app.features.chat.schema import ChatRequest, ChatResponse
from app.features.chat.service import ChatService
from fastapi import APIRouter, Depends, HTTPException

chat_router = APIRouter(prefix="/chat", tags=["Chat"])


@chat_router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest, service: ChatService = Depends(get_chat_service)
) -> ChatResponse:
    try:
        response = await service.send_message(
            request.user_message, request.conversation_id
        )
        return ChatResponse(response=response, conversation_id=request.conversation_id)
    except DeepSeekError as exc:
        raise HTTPException(status_code=502, detail="AI服务暂不可用") from exc
