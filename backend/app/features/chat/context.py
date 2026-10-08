from app.features.chat.llm.base import LLMMessage
from app.features.chat.model import Message


def valid_context(messages: list[Message], start: int = 0) -> list[LLMMessage]:
    return [
        LLMMessage(role=message.role, content=message.content)
        for message in messages[start:]
        if message.status == "completed"
    ]
