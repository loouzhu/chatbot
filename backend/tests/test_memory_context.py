import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from app.features.chat.constant import MessageRole, MessageStatus
from app.features.chat.service import ChatService


def memory(value, key=None, status="active"):
    return SimpleNamespace(value=value, key=key, status=status)


class MemoryContextTests(unittest.IsolatedAsyncioTestCase):
    async def prepare(self, memories, *, summary=None, limit=2000, content="hello"):
        conversation = SimpleNamespace(
            id="conversation", summary=summary,
            summarized_through_message_id="old" if summary else None,
        )
        old_message = SimpleNamespace(
            id="old", content="old history", role=MessageRole.USER,
            status=MessageStatus.COMPLETED,
        )
        repository = SimpleNamespace(
            get_history_messages=AsyncMock(return_value=[old_message]),
            add_message=AsyncMock(),
            get_long_term_memory=AsyncMock(return_value=memories),
        )

        async def add_message(message):
            repository.get_history_messages.return_value = [old_message, message]

        repository.add_message.side_effect = add_message
        client = SimpleNamespace(
            context_window=limit + 100, max_output_len=100, model="test"
        )
        with (
            patch("app.features.chat.service.require_conversation_access",
                  AsyncMock(return_value=conversation)),
            patch("app.features.chat.service.get_input_token", len),
            patch("app.features.chat.context.get_input_token", len),
        ):
            result = await ChatService(repository, client)._prepare_messages(
                content, "conversation", "user"
            )
        self.assertEqual(result.messages[-1].content, content)
        self.assertEqual(result.used_token, sum(len(m.content) for m in result.messages))
        self.assertEqual(result.rest_token, limit - result.used_token)
        self.assertGreaterEqual(result.rest_token, 0)
        return result

    async def test_memory_and_summary_coexist(self):
        result = await self.prepare([memory("Hangzhou", "city")], summary="summary")
        self.assertEqual([m.role for m in result.messages], [
            MessageRole.SYSTEM, MessageRole.SYSTEM, MessageRole.USER,
        ])
        self.assertIn("summary", result.messages[0].content)
        self.assertIn("Hangzhou", result.messages[1].content)
        self.assertNotIn("old history", [m.content for m in result.messages])

    async def test_empty_memory_does_not_add_system_message(self):
        result = await self.prepare([])
        self.assertTrue(all(m.role != MessageRole.SYSTEM for m in result.messages))

    async def test_inactive_blank_duplicate_and_unkeyed_memories(self):
        result = await self.prepare([
            memory("ignore", status="inactive"), memory("  "),
            memory("likes tea"), memory("likes tea"), memory("Chinese", "language"),
        ])
        context = result.messages[0].content
        self.assertNotIn("ignore", context)
        self.assertEqual(context.count("likes tea"), 1)
        self.assertIn('"key": null', context)
        self.assertIn("Chinese", context)

    async def test_oversized_memory_does_not_hide_smaller_memory(self):
        result = await self.prepare([memory("x" * 10000), memory("tea")])
        self.assertIn("tea", result.messages[0].content)
        self.assertNotIn("x" * 100, result.messages[0].content)

    async def test_full_user_budget_excludes_memory_and_summary(self):
        result = await self.prepare(
            [memory("tea")], summary="summary", limit=100, content="q" * 100
        )
        self.assertEqual(len(result.messages), 1)
        self.assertEqual(result.rest_token, 0)


if __name__ == "__main__":
    unittest.main()
