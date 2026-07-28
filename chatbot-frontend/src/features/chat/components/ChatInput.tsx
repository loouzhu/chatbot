import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { ArrowUpOutlined, PaperClipOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
import type { TextAreaRef } from "antd/es/input/TextArea";
import styles from "./ChatInput.module.less";

interface ChatInputProps {
  userInput: string;
  loading: boolean;
  inputRef: React.RefObject<TextAreaRef | null>;
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
        <Input.TextArea
          ref={inputRef}
          autoSize={{ minRows: 1, maxRows: 6 }}
          value={userInput}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder="给 BlueChat 发送消息"
          disabled={loading}
          aria-label="输入聊天消息"
          variant="borderless"
        />
        <div className={styles.composerActions}>
          <Button
            className={styles.attachButton}
            type="text"
            icon={<PaperClipOutlined />}
            disabled
            aria-label="添加附件（即将支持）"
            title="添加附件（即将支持）"
          />
          <span className={styles.inputHint}>Enter 发送 · Shift + Enter 换行</span>
          <Button
            className={styles.sendButton}
            type="primary"
            htmlType="submit"
            icon={<ArrowUpOutlined />}
            disabled={loading || !userInput.trim()}
            aria-label="发送消息"
            title="发送消息"
          />
        </div>
      </form>
      <p className={styles.disclaimer}>BlueChat 可能会出错，请核查重要信息。</p>
    </div>
  );
}
