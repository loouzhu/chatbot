import { Alert } from "antd";
import styles from "../styles/Auth.module.less";

interface StatusMessageProps {
  type: "success" | "error" | "info";
  children: React.ReactNode;
}

export function StatusMessage({ type, children }: StatusMessageProps) {
  return <Alert className={styles.statusMessage} type={type} message={children} showIcon />;
}
