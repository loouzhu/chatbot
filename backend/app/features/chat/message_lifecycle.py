"""Persist assistant message states and build their stream responses."""

import asyncio
import uuid
from asyncio.log import logger
from typing import TYPE_CHECKING

from app.features.chat.constant import MessageRole, MessageStatus
from app.features.chat.model import Message
from app.features.chat.schema import (
    ErrorInfoResponse,
    MessageResponse,
    StreamCreatedData,
    StreamDoneData,
    StreamFailedData,
    StreamGenerateData,
    StreamResponse,
    TokenUsage,
)

if TYPE_CHECKING:
    from app.features.chat.repository import ChatRepository


class MessageLifecycle:
    def __init__(self, repository: "ChatRepository"):
        self.repository = repository

    async def create(self, conversation_id: str) -> Message:
        message = to_db_message(
            content="",
            conversation_id=conversation_id,
            status=MessageStatus.CREATED,
            role=MessageRole.ASSISTANT,
        )
        return await self.repository.add_message(message)

    async def start_generating(self, message: Message, content: str) -> Message:
        updated = to_db_message(
            id=message.id,
            content=content,
            conversation_id=message.conversation_id,
            status=MessageStatus.GENERATING,
            role=MessageRole.ASSISTANT,
        )
        return await self.repository.update_message(updated)

    async def complete(
        self, message: Message, content: str, usage: TokenUsage | None
    ) -> StreamResponse:
        message.content = content
        message.status = MessageStatus.COMPLETED
        message.input_tokens = usage.input_tokens if usage else None
        message.output_tokens = usage.output_tokens if usage else None
        message.total_tokens = usage.total_tokens if usage else None
        updated = await self.repository.update_message(message)
        return StreamResponse(
            type=MessageStatus.COMPLETED,
            data=StreamDoneData(message=to_message_response(updated), usage=usage),
        )

    async def fail(
        self,
        message: Message,
        content: str,
        code: str | None,
        error_message: str,
    ) -> StreamResponse:
        failed = to_db_message(
            id=message.id,
            content=content,
            conversation_id=message.conversation_id,
            status=MessageStatus.FAILED,
            role=MessageRole.ASSISTANT,
            error_code=code or "",
            error_message=error_message,
        )
        updated = await self.repository.update_message(failed)
        return StreamResponse(
            type=MessageStatus.FAILED,
            data=StreamFailedData(
                message=to_message_response(updated),
                error=ErrorInfoResponse(
                    error_code=code or "UNKNOWN ERROR",
                    error_message=error_message,
                ),
            ),
        )

    async def cancel(self, message: Message, content: str) -> None:
        cancelled = to_db_message(
            id=message.id,
            content=content,
            conversation_id=message.conversation_id,
            status=MessageStatus.CANCELLED,
            role=MessageRole.ASSISTANT,
        )
        max_tries = 4
        for attempt in range(max_tries):
            try:
                await self.repository.update_message(cancelled)
                return
            except Exception:
                if attempt == max_tries - 1:
                    logger.exception(
                        "消息取消状态保存失败，已达到最大重试次数: %s",
                        message.id,
                    )
                    raise
                await asyncio.sleep(0.5 * attempt**2)


def to_db_message(
    content: str,
    conversation_id: str,
    status: MessageStatus,
    role: MessageRole,
    error_message: str = "",
    error_code: str = "",
    id: str = "",
) -> Message:
    return Message(
        id=id if len(id) > 0 else str(uuid.uuid4()),
        content=content,
        status=status,
        conversation_id=conversation_id,
        role=role,
        error_code=error_code,
        error_message=error_message,
    )


def to_message_response(message: Message) -> MessageResponse:
    return MessageResponse(
        id=message.id,
        role=message.role,
        status=message.status,
        content=message.content,
        created_at=message.created_at,
        error_code=message.error_code,
        error_message=message.error_message,
    )


def created_event(message: Message) -> StreamResponse:
    return StreamResponse(
        type=MessageStatus.CREATED,
        data=StreamCreatedData(id=message.id, role=message.role),
    )


def generating_event(content: str) -> StreamResponse:
    return StreamResponse(
        type=MessageStatus.GENERATING,
        data=StreamGenerateData(content=content),
    )
