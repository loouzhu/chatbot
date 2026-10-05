import {
  LogoutOutlined,
  MenuFoldOutlined,
  PlusOutlined,
  RobotOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button } from "antd";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ChatHistoryItem } from "@chat/types";
import { useSidebar } from "@chat/hooks/useChat";
import styles from "./index.module.less";

interface SideBarProps {
  history: ChatHistoryItem[];
  isCreatingConversation: boolean;
  onStartNewChat: () => void | Promise<void>;
}

export function SideBar({
  history,
  isCreatingConversation,
  onStartNewChat,
}: SideBarProps) {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const navigate = useNavigate();
  const { conversation_id } = useParams();
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
        disabled={isCreatingConversation}
        onClick={() => void onStartNewChat()}
      >
        新建对话
      </Button>

      <div className={styles.historySection}>
        <p className={styles.historyLabel}>最近</p>
        {history &&
          history.map((item) => (
            <div
              key={item.id}
              className={`${styles.historyItem} ${
                conversation_id === item.id ? styles.historyItemActive : ""
              }`}
              aria-current={conversation_id === item.id ? "page" : undefined}
              id={item.id}
              onClick={() => navigate(`/chat/${item.id}`)}
            >
              <span>{item.title}</span>
              <hr />
            </div>
          ))}
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
