import { useState } from "react";
import {
  BulbOutlined,
  CheckOutlined,
  CodeOutlined,
  CopyOutlined,
  EditOutlined,
  RobotOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import type { ChatMessage } from "../types";
import styles from "../../../app/App.module.less";

interface ChatWindowProps {
  chatLog: ChatMessage[];
  loading: boolean;
  chatWindowRef: React.RefObject<HTMLDivElement | null>;
  onPromptSelect: (prompt: string) => void;
}

const promptSuggestions = [
  { icon: BulbOutlined, label: "帮我梳理一个复杂问题", prompt: "请帮我梳理这个问题的思路：" },
  { icon: EditOutlined, label: "润色一段中文文案", prompt: "请帮我润色下面这段文字：" },
  { icon: CodeOutlined, label: "解释或优化一段代码", prompt: "请解释并优化下面这段代码：" },
  { icon: ThunderboltOutlined, label: "生成一个创意方案", prompt: "请为我生成一个创意方案，主题是：" },
];

export function ChatWindow({ chatLog, loading, chatWindowRef, onPromptSelect }: ChatWindowProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyMessage = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 1600);
  };

  return (
    <div className={styles.chatWindow} ref={chatWindowRef} aria-live="polite">
      <div className={styles.messageColumn}>
        {chatLog.length === 0 && !loading && (
          <div className={styles.emptyState}>
            <span className={styles.emptyLogo} aria-hidden="true">
              <ThunderboltOutlined />
            </span>
            <h1>今天想聊些什么？</h1>
            <p>我可以帮你分析问题、处理文字、编写代码或寻找灵感。</p>
            <div className={styles.promptGrid}>
              {promptSuggestions.map(({ icon: Icon, label, prompt }) => (
                <Button key={label} onClick={() => onPromptSelect(prompt)}>
                  <Icon aria-hidden="true" />
                  <span>{label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {chatLog.map((message, index) => (
          <article key={`${message.type}-${index}`} className={`${styles.messageRow} ${styles[message.type]}`}>
            <div className={styles.messageAvatar} aria-hidden="true">
              {message.type === "user" ? <span>你</span> : message.type === "error" ? <span>!</span> : <RobotOutlined />}
            </div>
            <div className={styles.messageBody}>
              <p className={styles.messageAuthor}>
                {message.type === "user" ? "你" : message.type === "error" ? "系统提示" : "BlueChat"}
              </p>
              <div className={styles.message}>{message.text}</div>
              {message.type === "bot" && (
                <Button
                  className={styles.copyButton}
                  type="text"
                  icon={copiedIndex === index ? <CheckOutlined /> : <CopyOutlined />}
                  title="复制回答"
                  aria-label="复制回答"
                  onClick={() => void copyMessage(message.text, index)}
                >
                  {copiedIndex === index ? "已复制" : "复制"}
                </Button>
              )}
            </div>
          </article>
        ))}

        {loading && (
          <article className={`${styles.messageRow} ${styles.bot}`}>
            <div className={styles.messageAvatar} aria-hidden="true"><RobotOutlined /></div>
            <div className={styles.messageBody}>
              <p className={styles.messageAuthor}>BlueChat</p>
              <div className={styles.loadingIndicator} aria-label="AI 正在思考"><i /><i /><i /></div>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
