from app.features.chat.models import ChatMessage, Conversation


def test_chat_models_expose_expected_fields_and_relationships():
    conversation = Conversation(id="conv-001")
    message = ChatMessage(
        id="msg-001",
        conversation_id="conv-001",
        role="user",
        content="hello",
        status="success",
    )

    assert conversation.id == "conv-001"
    assert message.conversation_id == "conv-001"
    assert message.role == "user"
    assert message.content == "hello"
    assert message.status == "success"
    assert message.conversation is None
