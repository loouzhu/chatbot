from app.cache.key import send_limit_key
from app.core.exceptions import AppException
from app.db.redis import redis_client


async def send_message_limit(user_id: str):
    limit_key = send_limit_key(
        business="chat",
        purpose="send_message",
        identifier=user_id,
    )
    allow = await redis_client.set(name=limit_key, value="send_message", nx=True, ex=5)
    if not allow:
        raise AppException(
            message="发送太频繁",
            code="TOO_MANY_REQUESTS",
            status_code=429,
        )
