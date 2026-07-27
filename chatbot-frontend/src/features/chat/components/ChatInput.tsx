import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { ArrowUp, Paperclip } from "lucide-react";
import styles from "../../../app/App.module.less";

interface ChatInputProps {
  userInput: string;
  loading: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function ChatInput({ userInput, loading, inputRef, onInputChange, onSubmit }: ChatInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className={styles.composerArea}>
      <form className={styles.chatForm} onSubmit={onSubmit}>
        <textarea
          ref={inputRef}
          rows={1}
          value={userInput}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder="给 BlueChat 发送消息"
          disabled={loading}
          aria-label="输入聊天消息"
        />
        <div className={styles.composerActions}>
          <button className={styles.attachButton} type="button" disabled aria-label="添加附件（即将支持）" title="添加附件（即将支持）">
            <Paperclip size={19} />
          </button>
          <span className={styles.inputHint}>Enter 发送 · Shift + Enter 换行</span>
          <button className={styles.sendButton} type="submit" disabled={loading || !userInput.trim()} aria-label="发送消息" title="发送消息">
            <ArrowUp size={20} />
          </button>
        </div>
      </form>
      <p className={styles.disclaimer}>BlueChat 可能会出错，请核查重要信息。</p>
    </div>
  );
}
