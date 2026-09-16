import {
  LogoutOutlined,
  MenuFoldOutlined,
  MessageOutlined,
  PlusOutlined,
  RobotOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button } from "antd";
import { Link } from "react-router-dom";
import type { ChatMessage } from "@chat/types";
import { useSidebar } from "@chat/hooks/useChat";
import styles from "./index.module.less";

interface SideBarProps {
  messages: ChatMessage[];
  isCreatingConversation: boolean;
  onStartNewChat: () => void | Promise<void>;
}

export function SideBar({
  messages,
  isCreatingConversation,
  onStartNewChat,
}: SideBarProps) {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const firstUserMessage = messages.find((message) => message.role === "user");
  const conversationTitle = firstUserMessage?.content || "新对话";
  return (
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
        disabled={!isCreatingConversation}
        onClick={() => void onStartNewChat()}
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
  );
}
