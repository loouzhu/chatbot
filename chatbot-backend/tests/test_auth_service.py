from types import SimpleNamespace

import pytest
from app.cache.verify_code import send_limit_key, verify_code_key
from app.features.auth.schemas import RegisterRequest, SendVerifyCodeRequest
from app.features.auth.service import register_user, send_verify_code


@pytest.mark.asyncio
async def test_register_user_creates_user_with_hashed_password(monkeypatch):
    class DummyRepository:
        def __init__(self, db):
            self.db = db

        def get_user_by_email(self, email):
            return None

        def get_user_by_username(self, username):
            return None

        def create_user(self, **kwargs):
            return SimpleNamespace(
                id=1,
                email=kwargs["email"],
                username=kwargs["username"],
            )

    monkeypatch.setattr("app.features.auth.service.AuthRepository", DummyRepository)
    monkeypatch.setattr(
        "app.features.auth.service.hash_code", lambda password: "hashed"
    )

    class DummyRedis:
        def __init__(self):
            self.store = {}

        def get(self, name):
            return self.store.get(name)

        def set(self, name, value, ex=None, nx=None):
            self.store[name] = value

        def delete(self, name):
            self.store.pop(name, None)

    redis_client = DummyRedis()
    redis_client.set(verify_code_key("test@example.com"), "123456")
    monkeypatch.setattr("app.features.auth.service.redis_client", redis_client)

    request = RegisterRequest(
        email="test@example.com",
        username="tester",
        password="123456",
        confirm_password="123456",
        verify_code="123456",
    )
    db = SimpleNamespace(close=lambda: None, commit=lambda: None)

    result = await register_user(request, db)

    assert result.email == "test@example.com"
    assert result.username == "tester"
    assert result.message == "注册成功"


@pytest.mark.asyncio
async def test_send_verify_code_uses_email_client(monkeypatch):
    captured = {}

    class DummyEmailClient:
        def __init__(self):
            pass

        async def send_mail(self, email: str, username: str, code: int):
            captured["email"] = email
            captured["username"] = username
            captured["code"] = code
            return {"ok": True}

    monkeypatch.setattr("app.features.auth.service.EmailClient", DummyEmailClient)

    class DummyRedis:
        def __init__(self):
            self.store = {}

        def get(self, name):
            return self.store.get(name)

        def set(self, name, value, ex=None, nx=None):
            self.store[name] = value

        def delete(self, name):
            self.store.pop(name, None)

    redis_client = DummyRedis()
    monkeypatch.setattr("app.features.auth.service.redis_client", redis_client)

    def fake_generate_code(email: str) -> str:
        redis_client.set(verify_code_key(email), "123456")
        redis_client.set(send_limit_key(email), "1", ex=60, nx=True)
        return "123456"

    monkeypatch.setattr("app.features.auth.service.generate_code", fake_generate_code)

    request = SendVerifyCodeRequest(
        email="test@example.com", username="alice", code=123456
    )
    result = await send_verify_code(request)

    assert result.email == "test@example.com"
    assert result.username == "alice"
    assert result.code == 200
    assert result.message == "发送验证码成功"
    assert captured["email"] == "test@example.com"
    assert captured["username"] == "alice"
    assert captured["code"] == "123456"
    assert redis_client.get(verify_code_key("test@example.com")) == "123456"
    assert redis_client.get(send_limit_key("test@example.com")) == "1"
