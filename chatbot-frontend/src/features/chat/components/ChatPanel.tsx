import { useChat } from "../hooks/useChat";
import styles from "../../../app/App.module.less";
import { ChatWindow } from "./ChatWindow";
import { ChatInput } from "./ChatInput";
import { Link } from "react-router-dom";

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
    <main className={styles.chatPage}>
      <section className={styles.chatShell} aria-label="BlueChat 智能对话">
        <header className={styles.chatHeader}>
          <div className={styles.brandGroup}>
            <span className={styles.brandMark} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M7 18.2 3.8 20l.8-3.8A8.3 8.3 0 0 1 3 11.3C3 6.7 7 3 12 3s9 3.7 9 8.3-4 8.3-9 8.3c-1.8 0-3.5-.5-5-1.4Z" />
                <path d="M8 11.4h.01M12 11.4h.01M16 11.4h.01" />
              </svg>
            </span>
            <div>
              <h1>BlueChat</h1>
              <p><span className={styles.onlineDot} /> AI 助手在线</p>
            </div>
          </div>
          <Link className={styles.exitLink} to="/auth/login" aria-label="退出聊天">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M10 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5M14 8l4 4-4 4M9 12h9" />
            </svg>
            <span>退出</span>
          </Link>
        </header>

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
      </section>
    </main>
  );
}
