from app.db.session import get_db
from app.features.auth.dependence import get_current_user
from app.features.auth.model import User
from app.features.chat.repository import ChatRepository
from app.features.chat.schema import (
    ConversationResponse,
    HistoryConversationResponse,
    MessageRequest,
)
from app.features.chat.service import ChatService
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

chat_router = APIRouter(prefix="/chat", tags=["Chat"])


async def get_chat_service(db: AsyncSession = Depends(get_db)) -> ChatService:
    return ChatService(ChatRepository(db))

# 开始新对话
@chat_router.post("/start_new_chat", response_model=ConversationResponse)
async def start_new_chat(
    user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
) -> ConversationResponse:
    return await service.start_new_chat(user_id=user.id)


# 生成一条回答
@chat_router.post("/request_message", response_model=None)
async def request_message(
    request: MessageRequest,
    user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    async def event_generator():
        async for event in service.stream_message(
            request.content,
            request.conversation_id,
            user.id,
        ):
            yield f"data: {event.model_dump_json()}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )

# 获取所有历史对话
@chat_router.get("/history/all", response_model=list[HistoryConversationResponse])
async def all_conversation_history(
    user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    return await service.get_all_history_conversations(user.id)

# 获取某一条历史对话
@chat_router.get("/history/{conversation_id}")
async def single_conversation_history(
    conversation_id: str,
    user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    return await service.get_single_conversation_history(user.id, conversation_id)

# 删除一条历史对话
@chat_router.delete("/delete_conversation")
async def delete_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    await service.delete_conversation(user.id, conversation_id)

# 停止生成回答
@chat_router.post('/stop_request_message/{message_id}')
async def stop_request_message(
    message_id:str,
    conversation_id: str,
    user:User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    await service.stop_request_message(user.id,message_id,conversation_id)