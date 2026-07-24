import { CheckIcon } from "./Icons";
import styles from "../styles/Auth.module.less";

interface StatusMessageProps {
  type: "success" | "error" | "info";
  children: React.ReactNode;
}

export function StatusMessage({ type, children }: StatusMessageProps) {
  return (
    <div className={`${styles.statusMessage} ${styles[type]}`} role="status">
      {type === "success" && <CheckIcon />}
      <span>{children}</span>
    </div>
  );
}
