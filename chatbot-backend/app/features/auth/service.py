import random

from app.cache.verify_code import send_limit_key, verify_code_key
from app.core.exceptions import AppException
from app.core.security import hash_code
from app.db.redis import redis_client
from app.features.auth.repository import AuthRepository
from app.features.auth.schemas import (
    RegisterRequest,
    RegisterResponse,
    SendVerifyCodeRequest,
    SendVerifyCodeResponse,
)
from app.integrations.email.client import EmailClient


class AuthException(AppException):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message, status_code)


def generate_code(email: str) -> str:
    verify_code = str(random.randint(100000, 999999))
    code_key = verify_code_key(email)
    limit_key = send_limit_key(email)

    if redis_client.get(limit_key):
        raise AuthException("请稍后再试", 400)

    redis_client.set(name=code_key, value=verify_code, ex=300, nx=True)
    redis_client.set(name=limit_key, value="1", ex=60, nx=True)
    return verify_code


async def send_verify_code(request: SendVerifyCodeRequest):
    try:
        verify_code = generate_code(email=str(request.email))
        email_client = EmailClient()
        await email_client.send_mail(
            email=str(request.email),
            username=request.username,
            code=verify_code,
        )
        return SendVerifyCodeResponse(
            email=request.email,
            username=request.username,
            code=200,
            message="发送验证码成功",
        )
    except Exception:
        redis_client.delete(verify_code_key(str(request.email)))
        raise AuthException("发送验证码失败", 500)


async def register_user(request: RegisterRequest, db) -> RegisterResponse:
    try:
        repository = AuthRepository(db)
        username = request.username
        email = str(request.email)
        password_hash = hash_code(request.password)
        verify_code = redis_client.get(verify_code_key(email))

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
        db.commit()
        redis_client.delete(verify_code_key(email))
        return RegisterResponse(
            email=user.email,
            username=user.username,
            message="注册成功",
        )
    except Exception:
        raise AuthException("创建用户失败", 500)
    finally:
        db.close()


# async def login_user(request:LoginRequest) -> LoginResponse:
