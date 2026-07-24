import type { ChatMessage } from "../types";
import styles from "../../../app/App.module.less";

interface ChatWindowProps {
  chatLog: ChatMessage[];
  loading: boolean;
  chatWindowRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatWindow({
  chatLog,
  loading,
  chatWindowRef,
}: ChatWindowProps) {
  return (
    <div className={styles.chatWindow} ref={chatWindowRef} aria-live="polite">
      {chatLog.map((message, index) => (
        <div
          key={`${message.type}-${index}`}
          className={`${styles.message} ${styles[message.type]}`}
        >
          {message.text}
        </div>
      ))}
      {loading && (
        <div className={styles.loadingIndicator}>Bot is thinking...</div>
      )}
    </div>
  );
}
