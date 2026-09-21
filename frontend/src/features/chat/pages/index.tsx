import { PlusOutlined, RobotOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useParams } from "react-router-dom";
import {
  useSendChatMessage,
  useMessages,
  useInput,
  useStartNewChat,
  useGetAllChatHisory,
} from "@chat/hooks/useChat";
import type { ChatMessage } from "@chat/types";
import styles from "./index.module.less";
import { ChatWindow } from "@/features/chat/pages/components/chat-window";
import { ChatInput } from "./components/chat-input";
import { SideBar } from "./components/side-bar";

export function ChatPanel() {
  const { input, setInput } = useInput();
  const { messages, setMessages } = useMessages();
  const { mutateAsync: sendChatMessage, isPending } = useSendChatMessage();
  const { mutateAsync: startNewChat, isPending: isCreatingConversation } =
    useStartNewChat();
  const { data: history = [], isLoading: isHistoryLoading } = useGetAllChatHisory();
  let { conversation_id } = useParams();

  const handleSubmit = async () => {
    const content = input.trim();
    if (!content || isPending || isCreatingConversation) return;
    const userMessage: ChatMessage = {
      id: "",
      role: "user",
      content,
      created_at: "",
    };

    try {
      let targetConversationId = conversation_id;
      if (!targetConversationId) {
        const newConversation = await startNewChat();
        targetConversationId = newConversation.id;
      }
      setInput("");
      setMessages((previousMessages) => [...previousMessages, userMessage]);
      const assistantMessage = await sendChatMessage({
        content,
        conversation_id: targetConversationId,
      });
      setMessages((previousMessages) => [
        ...previousMessages,
        assistantMessage,
      ]);
    } catch {
      setMessages((previousMessages) =>
        previousMessages.filter((message) => message !== userMessage),
      );
    }
  };

  const handleStartNewChat = async () => {
    const data = await startNewChat();
    setMessages(data.messages);
    setInput("");
  };

  return (
    <main className={styles.chatPage}>
      <SideBar
        history={history}
        isCreatingConversation={isCreatingConversation}
        onStartNewChat={handleStartNewChat}
      />
      <section className={styles.mainPanel} aria-label="BlueChat 智能对话">
        <header className={styles.chatHeader}>
          <Button className={styles.headerTitle}>
            <RobotOutlined aria-hidden="true" />
            <span>BlueChat</span>
            <small>AI 助手</small>
          </Button>
          <Button
            className={styles.headerNewChat}
            icon={<PlusOutlined />}
            disabled={isCreatingConversation}
            aria-label="新建对话"
            title="新建对话"
            onClick={handleStartNewChat}
          >
            <span>新对话</span>
          </Button>
        </header>

        <ChatWindow messages={messages} loading={isHistoryLoading} />
        <ChatInput
          input={input}
          loading={isPending}
          onInputChange={setInput}
          onSubmit={handleSubmit}
        />
      </section>
    </main>
  );
}
