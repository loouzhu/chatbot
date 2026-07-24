import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShieldIcon } from "./Icons";
import styles from "../styles/Auth.module.less";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  compact?: boolean;
}

export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
  compact = false,
}: AuthLayoutProps) {
  return (
    <main className={styles.authPage}>
      <div className={styles.ambientGlow} aria-hidden="true" />
      <Link className={styles.brand} to="/auth/login" aria-label="返回登录页">
        <span className={styles.brandMark}>
          <ShieldIcon />
        </span>
        <span>BlueChat</span>
      </Link>

      <section
        className={`${styles.authCard} ${compact ? styles.authCardCompact : ""}`}
      >
        <header className={styles.cardHeader}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        {children}
        {footer && <footer className={styles.cardFooter}>{footer}</footer>}
      </section>

      <p className={styles.pageFooter}>安全、简单地开启你的智能对话</p>
    </main>
  );
}
