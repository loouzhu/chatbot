from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.db.session import get_db
from app.features.auth.model import User
from app.features.auth.repository import AuthRepository

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise AppException("请先登录", "UNAUTHORIZED", 401)

    user = await AuthRepository(db).get_user_by_token(credentials.credentials)
    if user is None:
        raise AppException("登录已失效", "TOKEN_EXPIRED", 401)
    return user
