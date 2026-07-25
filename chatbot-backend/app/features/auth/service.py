import random

from app.core.exceptions import AppException
from app.core.security import hash_password
from app.db.redis import redis_client
from app.features.auth.repository import AuthRepository
from app.features.auth.schemas import (
    RegisterRequest,
    RegisterResponse,
    SendEmailRequest,
)
from app.integrations.email.client import EmailClient


class AuthException(AppException):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message, status_code)


def generate_code() -> int:
    verify_code = random.randint(100000, 999999)
    redis_client.set(name="verify_code", value=verify_code, ex=300)
    return verify_code


async def send_verify_code(request: SendEmailRequest):
    try:
        verify_code = generate_code()
        email_client = EmailClient()
        await email_client.send_mail(
            to_address=request.to_address,
            username=request.username,
            code=verify_code,
        )
    except Exception:
        redis_client.delete("verify_code")
        raise AuthException("发送邮件失败", 500)


async def register_user(request: RegisterRequest, db) -> RegisterResponse:
    try:
        repository = AuthRepository(db)
        username = request.username
        email = str(request.email)
        password_hash = hash_password(request.password)
        verify_code = redis_client.get("verify_code")

        if repository.get_user_by_email(request.email):
            raise AuthException("邮箱已被注册")

        if repository.get_user_by_username(request.username):
            raise AuthException("用户名已被占用")

        if request.verify_code != str(verify_code):
            raise AuthException("验证码不正确")

        user = repository.create_user(
            email=email,
            username=username,
            password_hash=password_hash,
        )

        return RegisterResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            message="注册成功",
        )
    finally:
        db.close()


# async def login_user(request:LoginRequest) -> LoginResponse:
