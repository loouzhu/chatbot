from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import uuid4

from app.db.base import Base
from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.features.chat.model import Conversation


# 用户表
class User(Base):
    __tablename__ = "user"

    id: Mapped[str] = mapped_column(
        String(64), default=lambda: str(uuid4()), primary_key=True, index=True
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
    )

    verification_codes: Mapped[list["VerificationCode"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    password_reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    token: Mapped[list["Token"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    conversations: Mapped[list["Conversation"]] = relationship(  # 使用字符串
        back_populates="user",
        cascade="all, delete-orphan",
    )


# 验证码表
class VerificationCode(Base):
    __tablename__ = "verification_codes"

    id: Mapped[str] = mapped_column(
        String(64), default=lambda: str(uuid4()), primary_key=True, index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    target: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    code_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    expire_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
    )

    user: Mapped[Optional[User]] = relationship(back_populates="verification_codes")


# 密码重置token表
class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[str] = mapped_column(
        String(64), default=lambda: str(uuid4()), primary_key=True, index=True
    )
    user_id: Mapped[str] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=func.now(),
    )

    user: Mapped[User] = relationship(back_populates="password_reset_tokens")


# token表
class Token(Base):
    __tablename__ = "Token"

    id: Mapped[str] = mapped_column(
        String(64), default=lambda: str(uuid4()), primary_key=True, index=True
    )
    user_id: Mapped[str] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    expire_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    user: Mapped[User] = relationship(back_populates="token")
