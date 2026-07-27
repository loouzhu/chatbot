import { useState } from "react";
import { Bot, Check, Clipboard, Code2, Lightbulb, PenLine, Sparkles } from "lucide-react";
import type { ChatMessage } from "../types";
import styles from "../../../app/App.module.less";

interface ChatWindowProps {
  chatLog: ChatMessage[];
  loading: boolean;
  chatWindowRef: React.RefObject<HTMLDivElement | null>;
  onPromptSelect: (prompt: string) => void;
}

const promptSuggestions = [
  { icon: Lightbulb, label: "帮我梳理一个复杂问题", prompt: "请帮我梳理这个问题的思路：" },
  { icon: PenLine, label: "润色一段中文文案", prompt: "请帮我润色下面这段文字：" },
  { icon: Code2, label: "解释或优化一段代码", prompt: "请解释并优化下面这段代码：" },
  { icon: Sparkles, label: "生成一个创意方案", prompt: "请为我生成一个创意方案，主题是：" },
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
              <Sparkles size={27} />
            </span>
            <h1>今天想聊些什么？</h1>
            <p>我可以帮你分析问题、处理文字、编写代码或寻找灵感。</p>
            <div className={styles.promptGrid}>
              {promptSuggestions.map(({ icon: Icon, label, prompt }) => (
                <button key={label} type="button" onClick={() => onPromptSelect(prompt)}>
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {chatLog.map((message, index) => (
          <article key={`${message.type}-${index}`} className={`${styles.messageRow} ${styles[message.type]}`}>
            <div className={styles.messageAvatar} aria-hidden="true">
              {message.type === "user" ? <span>你</span> : message.type === "error" ? <span>!</span> : <Bot size={18} />}
            </div>
            <div className={styles.messageBody}>
              <p className={styles.messageAuthor}>
                {message.type === "user" ? "你" : message.type === "error" ? "系统提示" : "BlueChat"}
              </p>
              <div className={styles.message}>{message.text}</div>
              {message.type === "bot" && (
                <button
                  className={styles.copyButton}
                  type="button"
                  title="复制回答"
                  aria-label="复制回答"
                  onClick={() => void copyMessage(message.text, index)}
                >
                  {copiedIndex === index ? <Check size={16} /> : <Clipboard size={16} />}
                  <span>{copiedIndex === index ? "已复制" : "复制"}</span>
                </button>
              )}
            </div>
          </article>
        ))}

        {loading && (
          <article className={`${styles.messageRow} ${styles.bot}`}>
            <div className={styles.messageAvatar} aria-hidden="true"><Bot size={18} /></div>
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
