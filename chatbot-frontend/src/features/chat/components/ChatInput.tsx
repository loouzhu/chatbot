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
      <input
        ref={inputRef}
        type="text"
        value={userInput}
        onChange={onInputChange}
        placeholder="Type your message..."
        disabled={loading}
        aria-label="Chat message input"
      />
      <button type="submit" disabled={loading}>
        Send
      </button>
    </form>
  );
}
