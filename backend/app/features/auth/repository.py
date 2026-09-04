import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.core.security import hash_token
from app.features.auth.model import Token, User
from app.features.auth.schemas import TokenResponse
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession


class AuthRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_email(self, email: str) -> Optional[User]:
        query = select(User).where(User.email == email)
        user = await self.db.execute(query)
        return user.scalar_one_or_none()

    async def get_user_by_username(self, username: str) -> Optional[User]:
        query = select(User).where(User.username == username)
        user = await self.db.execute(query)
        return user.scalar_one_or_none()

    async def get_user_by_user_id(self, user_id: str) -> Optional[User]:
        query = select(User).where(User.id == user_id)
        user = await self.db.execute(query)
        return user.scalar_one_or_none()

    async def create_user(
        self, *, email: str, username: str, password_hash: str
    ) -> User:
        user = User(
            email=email,
            username=username,
            password_hash=password_hash,
            status="active",
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user


class TokenRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_token(self, user_id: str) -> TokenResponse:
        token = secrets.token_urlsafe(32)
        hashed_token = hash_token(token)
        now = datetime.now(timezone.utc)
        expire_at = now + timedelta(days=7)

        await self.db.execute(delete(Token).where(Token.user_id == user_id))
        db_token = Token(
            id=str(uuid.uuid4()),
            token_hash=hashed_token,
            user_id=user_id,
            expire_at=expire_at,
        )
        self.db.add(db_token)
        await self.db.commit()
        await self.db.refresh(db_token)
        return TokenResponse(
            id=db_token.id, token=token, created_at=db_token.created_at
        )

    async def delete_tokens_by_user_id(self, user_id: str):
        query = delete(Token).where(Token.user_id == user_id)
        await self.db.execute(query)
        await self.db.commit()

    # async def get_valid_token(
    #     self,
    #     token_hash: str,
    # ) -> TokenResponse | None:
    #     now = datetime.now(timezone.utc)
    #     query = select(Token).where(
    #         Token.token_hash == token_hash,
    #         Token.expire_at > now,
    #     )
    #     res = await self.db.execute(query)
    #     token = res.one_or_none()
    #     if not token:
    #         return None
    #     return TokenResponse(
    #         id=token.id, token=token.token, created_at=token.created_at
    #     )
