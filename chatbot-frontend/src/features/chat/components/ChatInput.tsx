import type { ChangeEvent, FormEvent } from "react";
import styles from "../../../app/App.module.less";

interface ChatInputProps {
  userInput: string;
  loading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function ChatInput({
  userInput,
  loading,
  inputRef,
  onInputChange,
  onSubmit,
}: ChatInputProps) {
  return (
    <form className={styles.chatForm} onSubmit={onSubmit}>
      <div className={styles.inputBar}>
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={onInputChange}
          placeholder="输入消息，按 Enter 发送"
          disabled={loading}
          aria-label="输入聊天消息"
        />
        <button type="submit" disabled={loading || !userInput.trim()} aria-label="发送消息">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m5 12 14-7-4 14-3-6-7-1Z" />
            <path d="m12 13 7-8" />
          </svg>
        </button>
      </div>
      <p>AI 生成的内容可能不准确，请注意甄别。</p>
    </form>
  );
}
