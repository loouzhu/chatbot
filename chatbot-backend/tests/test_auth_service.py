from types import SimpleNamespace

import pytest
from app.features.auth.schemas import RegisterRequest, SendEmailRequest
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
        "app.features.auth.service.hash_password", lambda password: "hashed"
    )
    monkeypatch.setattr("app.features.auth.service.generate_code", lambda: 123456)

    request = RegisterRequest(
        email="test@example.com",
        username="tester",
        password="123456",
        confirm_password="123456",
        verify_code="123456",
    )
    db = SimpleNamespace(close=lambda: None)

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

        async def send_mail(self, to_address: str, username: str, code: int):
            captured["to_address"] = to_address
            captured["username"] = username
            captured["code"] = code
            return {"ok": True}

    monkeypatch.setattr("app.features.auth.service.EmailClient", DummyEmailClient)
    monkeypatch.setattr("app.features.auth.service.generate_code", lambda: 123456)

    request = SendEmailRequest(
        to_address="test@example.com", username="alice", code=123456
    )
    result = await send_verify_code(request)

    assert result == {"ok": True}
    assert captured["to_address"] == "test@example.com"
    assert captured["username"] == "alice"
    assert isinstance(captured["code"], int)
