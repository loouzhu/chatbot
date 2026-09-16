from app.db.session import get_db
from app.features.auth.dependence import get_current_user
from app.features.auth.model import User
from app.features.chat.repository import ChatRepository
from app.features.chat.schema import (
    ConversationResponse,
    HistoryConversationResponse,
    MessageRequest,
    MessageResponse,
)
from app.features.chat.service import ChatService
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

chat_router = APIRouter(prefix="/chat", tags=["Chat"])


async def get_chat_service(db: AsyncSession = Depends(get_db)) -> ChatService:
    return ChatService(ChatRepository(db))


@chat_router.post("/start_new_chat", response_model=ConversationResponse)
async def start_new_chat(
    user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
) -> ConversationResponse:
    return await service.start_new_chat(user_id=user.id)


@chat_router.post("/send_message", response_model=MessageResponse)
async def send_message(
    request: MessageRequest,
    user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
) -> MessageResponse:
    return await service.send_message(request.content, request.conversation_id, user.id)


@chat_router.get("/history", response_model=list[HistoryConversationResponse])
async def history(
    user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    return await service.get_history_conversations(user.id)


@chat_router.delete("/delete_conversation")
async def delete_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    await service.delete_conversation(user.id, conversation_id)
