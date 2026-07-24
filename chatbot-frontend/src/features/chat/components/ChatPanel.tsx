import { useChat } from "../hooks/useChat";
import styles from "../../../app/App.module.less";
import { ChatWindow } from "./ChatWindow";
import { ChatInput } from "./ChatInput";

export function ChatPanel() {
  const {
    userInput,
    chatLog,
    loading,
    chatWindowRef,
    inputRef,
    handleInputChange,
    handleSubmit,
  } = useChat();

  return (
    <div className={styles.app}>
      <h1 className={styles.chatTitle}>~AI Chat Assistant</h1>
      <ChatWindow
        chatLog={chatLog}
        loading={loading}
        chatWindowRef={chatWindowRef}
      />
      <ChatInput
        userInput={userInput}
        loading={loading}
        inputRef={inputRef}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
