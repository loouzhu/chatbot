import asyncio

from app.features.chat.llm.deepseek import DeepSeekError, DeepSeekProvider


class StubResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self._payload


def test_deepseek_provider_sends_messages_payload(monkeypatch):
    captured = {}

    class FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            self.args = args
            self.kwargs = kwargs

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, json, headers):
            captured["url"] = url
            captured["json"] = json
            captured["headers"] = headers
            return StubResponse(
                {"choices": [{"message": {"content": "hello from provider"}}]}
            )

    monkeypatch.setattr("app.features.chat.llm.base.httpx.AsyncClient", FakeAsyncClient)

    provider = DeepSeekProvider(
        api_key="secret",
        model="test-model",
        api_url="https://example.test/v1/chat/completions",
        error_cls=DeepSeekError,
    )

    result = asyncio.run(provider.chat("hello"))

    assert result == "hello from provider"
    assert captured["json"]["messages"][0]["content"] == "hello"
    assert captured["headers"]["Authorization"] == "Bearer secret"
