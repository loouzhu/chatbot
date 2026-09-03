from app.db.session import get_db
from app.features.chat.llm.deepseek import DeepSeekError
from app.features.chat.repository import ChatRepository
from app.features.chat.schema import MessageRequest, MessageResponse
from app.features.chat.service import ChatService
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

chat_router = APIRouter(prefix="/chat", tags=["Chat"])


async def get_chat_service(db: AsyncSession = Depends(get_db)) -> ChatService:
    return ChatService(ChatRepository(db))


@chat_router.post("/send_message", response_model=MessageResponse)
async def send_message(
    request: MessageRequest, service: ChatService = Depends(get_chat_service)
) -> MessageResponse:
    try:
        response = await service.send_message(request.content, request.conversation_id)
        return response
    except DeepSeekError as exc:
        raise HTTPException(status_code=502, detail="AI服务暂不可用") from exc
