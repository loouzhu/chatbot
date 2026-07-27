import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  LogOut,
  Menu,
  MessageSquare,
  PanelLeftClose,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { useChat } from "../hooks/useChat";
import styles from "../../../app/App.module.less";
import { ChatWindow } from "./ChatWindow";
import { ChatInput } from "./ChatInput";

export function ChatPanel() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    userInput,
    chatLog,
    loading,
    chatWindowRef,
    inputRef,
    handleInputChange,
    handleSubmit,
    handlePromptSelect,
    clearChat,
  } = useChat();

  const firstUserMessage = chatLog.find((message) => message.type === "user");
  const conversationTitle = firstUserMessage?.text || "新的对话";

  const startNewChat = () => {
    clearChat();
    setSidebarOpen(false);
  };

  return (
    <main className={styles.chatPage}>
      {sidebarOpen && (
        <button
          className={styles.sidebarBackdrop}
          type="button"
          aria-label="关闭侧边栏"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
        aria-label="对话侧边栏"
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarBrand}>
            <span className={styles.logoMark} aria-hidden="true">
              <Sparkles size={19} />
            </span>
            <span>BlueChat</span>
          </div>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="收起侧边栏"
            title="收起侧边栏"
            onClick={() => setSidebarOpen(false)}
          >
            <PanelLeftClose size={19} />
          </button>
        </div>

        <button className={styles.newChatButton} type="button" onClick={startNewChat}>
          <Plus size={18} />
          <span>新建对话</span>
        </button>

        <div className={styles.historySection}>
          <p className={styles.historyLabel}>最近</p>
          <button className={styles.historyItem} type="button" aria-current="page">
            <MessageSquare size={17} />
            <span>{conversationTitle}</span>
          </button>
        </div>

        <div className={styles.sidebarFooter}>
          <Link className={styles.sidebarFooterItem} to="/auth/login">
            <LogOut size={18} />
            <span>退出登录</span>
          </Link>
        </div>
      </aside>

      <section className={styles.mainPanel} aria-label="BlueChat 智能对话">
        <header className={styles.chatHeader}>
          <button
            className={`${styles.iconButton} ${styles.menuButton}`}
            type="button"
            aria-label={sidebarOpen ? "关闭侧边栏" : "打开侧边栏"}
            title={sidebarOpen ? "关闭侧边栏" : "打开侧边栏"}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className={styles.headerTitle}>
            <Bot size={19} aria-hidden="true" />
            <span>BlueChat</span>
            <small>AI 助手</small>
          </div>
          <button
            className={styles.headerNewChat}
            type="button"
            onClick={startNewChat}
            aria-label="新建对话"
            title="新建对话"
          >
            <Plus size={19} />
            <span>新对话</span>
          </button>
        </header>

        <ChatWindow
          chatLog={chatLog}
          loading={loading}
          chatWindowRef={chatWindowRef}
          onPromptSelect={handlePromptSelect}
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
