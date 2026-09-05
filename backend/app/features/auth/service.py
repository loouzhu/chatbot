import random

from app.cache.verify_code import send_limit_key, verify_code_key
from app.core.exceptions import AppException
from app.core.security import hash_code
from app.db.redis import redis_client
from app.features.auth.model import User
from app.features.auth.repository import AuthRepository, TokenRepository
from app.features.auth.schemas import (
    EmailLoginRequest,
    LoginResponse,
    LogoutResponse,
    Purpose,
    RegisterRequest,
    RegisterResponse,
    SendVerifyCodeRequest,
    SendVerifyCodeResponse,
    UsernameLoginRequest,
    UserResponse,
)
from app.integrations.email.client import EmailClient
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession


def verify_password(password: str, hashed_password: str) -> bool:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.verify(password, hashed_password)


def to_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        status=user.status,
        created_at=user.created_at,
    )


async def generate_verify_code(email: str, purpose: str = "register") -> str:
    if isinstance(purpose, Purpose):
        purpose = purpose.value
    verify_code = str(random.randint(100000, 999999))
    code_key = verify_code_key("auth", purpose, email)
    limit_key = send_limit_key("auth", purpose, email)

    if await redis_client.get(limit_key):
        raise AppException("请稍后再试", "RATE_LIMITED", 400)

    await redis_client.set(name=code_key, value=verify_code, ex=300)
    await redis_client.set(name=limit_key, value="1", ex=60, nx=True)
    return verify_code


async def send_verify_code(request: SendVerifyCodeRequest):
    verify_code = await generate_verify_code(
        email=str(request.email), purpose=request.purpose
    )
    email_client = EmailClient()
    res = await email_client.send_mail(
        email=str(request.email),
        username=request.username,
        code=verify_code,
    )
    print(res)
    return SendVerifyCodeResponse(
        message="发送验证码成功",
        code="SUCCESS",
    )


async def register_user(request: RegisterRequest, db: AsyncSession) -> RegisterResponse:
    repository = AuthRepository(db)
    username = request.username
    email = str(request.email)
    password_hash = hash_code(request.password)
    verify_code = await redis_client.get(verify_code_key("auth", "register", email))

    if await repository.get_user_by_email(request.email):
        raise AppException("邮箱已被注册", "EMAIL_EXISTS", 400)

    if await repository.get_user_by_username(request.username):
        raise AppException("用户名已被占用", "USERNAME_EXISTS", 400)

    if request.verify_code != str(verify_code):
        raise AppException("验证码不正确", "INVALID_VERIFY_CODE", 400)

    await repository.create_user(
        email=email,
        username=username,
        password_hash=password_hash,
    )
    await redis_client.delete(verify_code_key("auth", "register", email))
    return RegisterResponse(
        message="注册成功",
        code="SUCCESS",
    )


async def email_login_user(
    request: EmailLoginRequest, db: AsyncSession
) -> LoginResponse:
    user_repository = AuthRepository(db)
    token_repository = TokenRepository(db)

    email = str(request.email)
    verify_code = await redis_client.get(verify_code_key("auth", "login", email))
    if request.verify_code != str(verify_code):
        raise AppException("验证码不正确", "INVALID_VERIFY_CODE", 400)
    await redis_client.delete(verify_code_key("auth", "login", email))

    user = await user_repository.get_user_by_email(email)
    if not user:
        raise AppException("未注册的邮箱", "EMAIL_NOT_FOUND", 400)
    token = await token_repository.create_token(user.id)
    return LoginResponse(
        token=token,
        user=to_user_response(user),
        message="登录成功",
        code="SUCCESS",
    )


async def username_login_user(
    request: UsernameLoginRequest, db: AsyncSession
) -> LoginResponse:
    token_repository = TokenRepository(db)
    user_repository = AuthRepository(db)
    user = await user_repository.get_user_by_username(request.username)

    if not user or not verify_password(request.password, user.password_hash):
        raise AppException("用户名或密码错误", "INVALID_PASSWORD", 400)

    token = await token_repository.create_token(user.id)

    return LoginResponse(
        token=token,
        user=to_user_response(user),
        message="登录成功",
        code="SUCCESS",
    )


async def logout_user(user_id: str, db: AsyncSession) -> LogoutResponse:
    user_repository = AuthRepository(db)
    token_repository = TokenRepository(db)
    user = await user_repository.get_user_by_user_id(user_id)
    if not user:
        raise AppException("未找到用户", "NOT_FOUND_USER", 404)
    await token_repository.delete_tokens_by_user_id(user_id)
    return LogoutResponse(
        message="退出登录成功",
        code="SUCCESS",
    )
