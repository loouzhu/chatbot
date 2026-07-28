import { useState } from "react";
import {
  CloseOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MessageOutlined,
  PlusOutlined,
  RobotOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button } from "antd";
import { Link } from "react-router-dom";
import { useChat } from "../hooks/useChat";
import styles from "./ChatPanel.module.less";
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
        <Button
          className={styles.sidebarBackdrop}
          type="text"
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
              <RobotOutlined />
            </span>
            <span>BlueChat</span>
          </div>
          <Button
            className={styles.iconButton}
            type="text"
            icon={<MenuFoldOutlined />}
            aria-label="收起侧边栏"
            title="收起侧边栏"
            onClick={() => setSidebarOpen(false)}
          />
        </div>

        <Button
          className={styles.newChatButton}
          icon={<PlusOutlined />}
          onClick={startNewChat}
          block
        >
          新建对话
        </Button>

        <div className={styles.historySection}>
          <p className={styles.historyLabel}>最近</p>
          <Button
            className={styles.historyItem}
            type="text"
            icon={<MessageOutlined />}
            aria-current="page"
            block
          >
            <span>{conversationTitle}</span>
          </Button>
        </div>

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarProfile}>
            <Avatar
              className={styles.sidebarAvatar}
              size={30}
              icon={<UserOutlined />}
            />
            <span>我的账户</span>
          </div>
          <Link
            className={`${styles.sidebarFooterItem} ${styles.sidebarLogout}`}
            to="/auth/login"
            aria-label="退出登录"
            title="退出登录"
          >
            <LogoutOutlined />
            <span>退出登录</span>
          </Link>
        </div>
      </aside>

      <section className={styles.mainPanel} aria-label="BlueChat 智能对话">
        <header className={styles.chatHeader}>
          <Button
            className={`${styles.iconButton} ${styles.menuButton}`}
            type="text"
            icon={sidebarOpen ? <CloseOutlined /> : <MenuOutlined />}
            aria-label={sidebarOpen ? "关闭侧边栏" : "打开侧边栏"}
            title={sidebarOpen ? "关闭侧边栏" : "打开侧边栏"}
            onClick={() => setSidebarOpen((open) => !open)}
          />
          <div className={styles.headerTitle}>
            <RobotOutlined aria-hidden="true" />
            <span>BlueChat</span>
            <small>AI 助手</small>
          </div>
          <Button
            className={styles.headerNewChat}
            icon={<PlusOutlined />}
            onClick={startNewChat}
            aria-label="新建对话"
            title="新建对话"
          >
            <span>新对话</span>
          </Button>
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
