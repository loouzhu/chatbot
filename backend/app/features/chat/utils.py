from app.core.exceptions import AppException
from app.features.chat.model import Conversation
from app.features.chat.repository import ChatRepository


async def require_conversation_access(
    user_id: str, conversation_id: str, repository: ChatRepository
) -> Conversation:
    """Return the conversation if the user exists and owns it."""
    if await repository.get_user_by_id(user_id) is None:
        raise AppException("未找到用户", "NOT_FOUND", 404)

    conversation = await repository.get_conversation_by_id(conversation_id)
    if conversation is None:
        raise AppException("未找到对话", "NOT_FOUND", 404)
    if conversation.user_id != user_id:
        raise AppException("无权访问该对话", "UNAUTHORIZED", 403)

    return conversation
