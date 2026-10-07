from collections.abc import AsyncIterator
from typing import Protocol, cast

from app.features.chat.schema import MessageRole
from openai import AsyncOpenAI
from openai.types.responses import ResponseInputItemParam, ResponseStreamEvent
from pydantic import BaseModel


class LLMMessage(BaseModel):
    role: MessageRole
    content: str


# 任何实现了chat类都能被视为LLM客户端
class LLMClient(Protocol):
    def stream_chat(
        self, messages: list[LLMMessage]
    ) -> AsyncIterator[ResponseStreamEvent]: ...


def to_openai_messages(messages: list[LLMMessage]) -> list[ResponseInputItemParam]:
    return [
        cast(
            ResponseInputItemParam,
            {
                "role": message.role.value,
                "content": message.content,
            },
        )
        for message in messages
    ]


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

    async def stream_chat(
        self, messages: list[LLMMessage]
    ) -> AsyncIterator[ResponseStreamEvent]:
        if not self.api_key:
            raise self.error_cls("缺少APIKey")
        if not self.model:
            raise self.error_cls("缺少模型名称")
        if not self.api_url:
            raise self.error_cls("缺少API地址")
        client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.api_url,
        )

        stream = await client.responses.create(
            model=self.model,
            input=to_openai_messages(messages),
            stream=True,
        )

        async for chunk in stream:
            yield chunk
