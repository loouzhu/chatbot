from app.db.session import get_db
from app.features.auth.model import User
from app.features.auth.repository import AuthRepository
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="请先登录")

    user = await AuthRepository(db).get_user_by_token(credentials.credentials)
    if user is None:
        raise HTTPException(status_code=401, detail="登录已失效")
    return user
