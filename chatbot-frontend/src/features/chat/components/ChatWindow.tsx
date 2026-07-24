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
      {chatLog.length === 0 && !loading && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M7 18.2 3.8 20l.8-3.8A8.3 8.3 0 0 1 3 11.3C3 6.7 7 3 12 3s9 3.7 9 8.3-4 8.3-9 8.3c-1.8 0-3.5-.5-5-1.4Z" />
              <path d="M8 11.4h.01M12 11.4h.01M16 11.4h.01" />
            </svg>
          </span>
          <h2>有什么可以帮你？</h2>
          <p>输入你的问题，开始一段新的对话。</p>
        </div>
      )}
      {chatLog.map((message, index) => (
        <div
          key={`${message.type}-${index}`}
          className={`${styles.messageRow} ${styles[message.type]}`}
        >
          {message.type !== "user" && (
            <span className={styles.messageAvatar} aria-hidden="true">
              {message.type === "error" ? "!" : "B"}
            </span>
          )}
          <div className={styles.message}>{message.text}</div>
        </div>
      ))}
      {loading && (
        <div className={`${styles.messageRow} ${styles.bot}`}>
          <span className={styles.messageAvatar} aria-hidden="true">B</span>
          <div className={`${styles.message} ${styles.loadingIndicator}`} aria-label="AI 正在思考">
            <i /><i /><i />
          </div>
        </div>
      )}
    </div>
  );
}
