from collections.abc import AsyncIterator
from typing import Protocol, cast

from app.core.exceptions import AppException
from app.features.chat.schema import MessageRole
from openai import AsyncOpenAI
from openai.types.responses import ResponseInputItemParam, ResponseStreamEvent
from pydantic import BaseModel


class LLMMessage(BaseModel):
    role: MessageRole
    content: str


class LLMException(AppException):
    def __init__(
        self,
        message: str,
        model_name: str,
        code: str | None = None,
        status_code: int = 500,
    ):
        super().__init__(message, code, status_code)
        self.model_name = model_name


# 任何实现了chat类都能被视为LLM客户端
class LLMClient(Protocol):
    model: str
    context_window: int
    max_output_len: int

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
        context_window: int,
        max_output_len: int,
    ):
        self.api_key = api_key
        self.model = model
        self.api_url = api_url
        self.error_cls = error_cls
        self.context_window = context_window
        self.max_output_len = max_output_len

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
            max_output_tokens=self.max_output_len,
            stream=True,
        )

        token_limit = self.context_window - self.max_output_len

        if token_limit <= 0:
            raise LLMException(
                message="模型上下文窗口配置错误",
                code="INVALID_CONTEXT_WINDOW",
                model_name=self.model,
                status_code=500,
            )

        async for chunk in stream:
            yield chunk
