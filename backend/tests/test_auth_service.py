import asyncio

from app.features.auth import service
from app.features.auth.schemas import Purpose


class FakeRedis:
    def __init__(self):
        self.values = {}

    async def get(self, key):
        return self.values.get(key)

    async def set(self, name, value, ex, nx=False):
        if nx and name in self.values:
            return False
        self.values[name] = value
        return True


def test_generate_verify_code_uses_enum_value_for_redis_key(monkeypatch):
    redis = FakeRedis()
    monkeypatch.setattr(service, "redis_client", redis)

    asyncio.run(
        service.generate_verify_code("user@example.com", purpose=Purpose.REGISTER)
    )

    assert "auth:register:verify_code:user@example.com" in redis.values
    assert "auth:Purpose.REGISTER:verify_code:user@example.com" not in redis.values
