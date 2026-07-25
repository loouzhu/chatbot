from typing import Optional

from app.features.auth.models import User
from sqlalchemy import select
from sqlalchemy.orm import Session


class AuthRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.db.scalar(select(User).where(User.email == email))

    def get_user_by_username(self, username: str) -> Optional[User]:
        return self.db.scalar(select(User).where(User.username == username))

    def create_user(self, *, email: str, username: str, password_hash: str) -> User:
        user = User(
            email=email,
            username=username,
            password_hash=password_hash,
            status="active",
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
