"""Translate provider stream events into chat generation events."""

from collections.abc import AsyncGenerator
from contextlib import aclosing
from dataclasses import dataclass

from app.features.chat.schema import TokenUsage
from app.integrations.llm.base import LLMClient, LLMMessage
from openai import APIConnectionError, APIStatusError, APITimeoutError


@dataclass(frozen=True)
class Delta:
    text: str


@dataclass(frozen=True)
class Completed:
    usage: TokenUsage | None


@dataclass(frozen=True)
class Failed:
    code: str | None
    message: str


class GenerationError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


async def stream_llm_events(
    client: LLMClient, messages: list[LLMMessage]
) -> AsyncGenerator[Delta | Completed | Failed, None]:
    try:
        async with aclosing(client.stream_chat(messages)) as chunks:
            async for chunk in chunks:
                if chunk.type == "response.output_text.delta":
                    yield Delta(chunk.delta)
                elif chunk.type == "error":
                    yield Failed(chunk.code, chunk.message)
                elif chunk.type == "response.completed":
                    usage = chunk.response.usage
                    yield Completed(
                        TokenUsage.model_validate(usage.model_dump())
                        if usage is not None
                        else None
                    )
    except APITimeoutError as error:
        raise GenerationError("GENERATION_TIMEOUT", "生成超时，请重试") from error
    except APIStatusError as error:
        raise GenerationError("UPSTREAM_API_ERROR", "模型服务暂时不可用") from error
    except APIConnectionError as error:
        raise GenerationError("UPSTREAM_CONNECTION_ERROR", "模型连接中断") from error
