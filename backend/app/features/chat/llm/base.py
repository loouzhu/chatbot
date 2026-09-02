from typing import Protocol

import httpx
from pydantic import BaseModel


class LLMMessage(BaseModel):
    role: str
    content: str


class LLMClient(Protocol):
    async def chat(self, messages: list[LLMMessage]) -> str: ...


class LLMProvider:
    def __init__(
        self,
        api_key: str,
        model: str,
        api_url: str,
        error_cls: type[Exception],
    ):
        self.api_key = api_key
        self.model = model
        self.api_url = api_url
        self.error_cls = error_cls

    async def chat(self, message: list[LLMMessage]) -> str:
        if not self.api_key:
            raise self.error_cls("缺少APIKey")

        content = message.content if hasattr(message, "content") else str(message)

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": content}],
            "temperature": 0.7,
        }
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(
                    self.api_url,
                    json=payload,
                    headers=headers,
                )
                response.raise_for_status()
                body = response.json()
        except httpx.HTTPStatusError as exc:
            raise self.error_cls(
                f"{self.model}请求失败，错误码：{exc.response.status_code}"
            ) from exc
        except httpx.RequestError as exc:
            raise self.error_cls(f"连接{self.model}失败") from exc

        try:
            return body["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise self.error_cls(f"{self.model}回复失败") from exc
