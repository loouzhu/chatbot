import random

from app.cache.verify_code import send_limit_key, verify_code_key
from app.core.exceptions import AppException
from app.core.security import hash_code
from app.db.redis import redis_client
from app.features.auth.repository import AuthRepository
from app.features.auth.schemas import (
    EmailLoginRequest,
    EmailLoginResponse,
    RegisterRequest,
    RegisterResponse,
    SendVerifyCodeRequest,
    SendVerifyCodeResponse,
    UsernameLoginRequest,
    UsernameLoginResponse,
)
from app.integrations.email.client import EmailClient
from passlib.context import CryptContext


class AuthException(AppException):
    def __init__(self, message: str, status_code: int = 400, code: str = ""):
        super().__init__(message, status_code, code)


def verify_password(password: str, hashed_password: str) -> bool:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return pwd_context.verify(password, hashed_password)


def generate_code(email: str, purpose: str = "register") -> str:
    verify_code = str(random.randint(100000, 999999))
    code_key = verify_code_key("auth", purpose, email)
    limit_key = send_limit_key("auth", purpose, email)

    if redis_client.get(limit_key):
        raise AuthException("请稍后再试", 400)

    redis_client.set(name=code_key, value=verify_code, ex=300, nx=True)
    redis_client.set(name=limit_key, value="1", ex=60, nx=True)
    return verify_code


async def send_verify_code(request: SendVerifyCodeRequest):
    try:
        verify_code = generate_code(email=str(request.email), purpose=request.purpose)
        email_client = EmailClient()
        res = await email_client.send_mail(
            email=str(request.email),
            username=request.username,
            code=verify_code,
        )
        print(res)
        return SendVerifyCodeResponse(
            email=request.email,
            username=request.username,
            code=200,
            message="发送验证码成功",
        )
    except Exception:
        redis_client.delete(
            verify_code_key("auth", request.purpose, str(request.email))
        )
        raise AuthException("发送验证码失败", 500)


async def register_user(request: RegisterRequest, db) -> RegisterResponse:
    try:
        repository = AuthRepository(db)
        username = request.username
        email = str(request.email)
        password_hash = hash_code(request.password)
        verify_code = redis_client.get(verify_code_key("auth", "register", email))

        if repository.get_user_by_email(request.email):
            raise AuthException("邮箱已被注册", 409)

        if repository.get_user_by_username(request.username):
            raise AuthException("用户名已被占用", 409)

        if request.verify_code != str(verify_code):
            raise AuthException("验证码不正确", 400)

        user = repository.create_user(
            email=email,
            username=username,
            password_hash=password_hash,
        )
        db.commit()
        redis_client.delete(verify_code_key("auth", "register", email))
        return RegisterResponse(
            email=user.email,
            username=user.username,
            message="注册成功",
        )
    except Exception as e:
        raise AuthException(f"创建用户失败,{e}", 500)
    finally:
        db.close()


async def email_login_user(request: EmailLoginRequest, db) -> EmailLoginResponse:
    try:
        repository = AuthRepository(db)
        email = str(request.email)
        verify_code = redis_client.get(verify_code_key("auth", "login", email))
        user = repository.get_user_by_email(email)

        if not user:
            raise AuthException("未注册的邮箱", 401)

        if request.verify_code != str(verify_code):
            raise AuthException("验证码不正确", 400)

        redis_client.delete(verify_code_key("auth", "login", email))
        return EmailLoginResponse(
            email=user.email,
            message="登录成功",
        )
    except Exception:
        raise AuthException("邮箱登录失败", 500)
    finally:
        db.close()


async def username_login_user(
    request: UsernameLoginRequest, db
) -> UsernameLoginResponse:
    try:
        repository = AuthRepository(db)
        user = repository.get_user_by_username(request.username)

        if not user:
            raise AuthException("用户不存在", 401)

        if not verify_password(request.password, user.password_hash):
            raise AuthException("用户名或密码错误", 401)

        return UsernameLoginResponse(
            username=user.username,
            message="登录成功",
        )
    except Exception:
        raise AuthException("用户名密码登录失败", 500)
    finally:
        db.close()
