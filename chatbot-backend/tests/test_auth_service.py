import pytest
from app.features.auth.schemas import RegisterRequest
from app.features.auth.service import register_user


@pytest.mark.asyncio
async def test_register_user_creates_user_with_hashed_password():
    request = RegisterRequest(
        email="test@example.com",
        username="tester",
        password="123456",
        confirm_password="123456",
        email_code="123456",
    )

    result = await register_user(request)

    assert result["email"] == "test@example.com"
    assert result["username"] == "tester"
    assert result["message"] == "注册成功"
