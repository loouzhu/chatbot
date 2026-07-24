import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { LockIcon, UserIcon } from "../components/Icons";
import { StatusMessage } from "../components/StatusMessage";
import {
  validateEmail,
  validateUsername,
  type FieldErrors,
} from "../utils/validation";
import styles from "../styles/Auth.module.less";

type LoginField = "account" | "password";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = (location.state as { message?: string } | null)?.message;
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors<LoginField>>({});
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate(): FieldErrors<LoginField> {
    const nextErrors: FieldErrors<LoginField> = {};
    if (!account.trim()) {
      nextErrors.account = "请输入邮箱或用户名";
    } else {
      nextErrors.account = account.includes("@")
        ? validateEmail(account)
        : validateUsername(account);
    }
    if (!password) nextErrors.password = "请输入密码";
    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setRequestError("");
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      await authApi.login({ account: account.trim(), password });
      navigate("/chat", { replace: true });
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "邮箱/用户名或密码错误",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="欢迎回来"
      title="登录你的账号"
      description="继续你的智能对话，灵感从这里开始。"
      compact
      footer={
        <p>
          还没有账号？ <Link to="/auth/register">立即注册</Link>
        </p>
      }
    >
      <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
        {successMessage && <StatusMessage type="success">{successMessage}</StatusMessage>}
        {requestError && <StatusMessage type="error">{requestError}</StatusMessage>}

        <FormField
          label="邮箱或用户名"
          icon={<UserIcon />}
          placeholder="请输入邮箱或用户名"
          autoComplete="username"
          value={account}
          error={errors.account}
          onChange={(event) => {
            setAccount(event.target.value);
            setErrors((current) => ({ ...current, account: undefined }));
          }}
        />
        <FormField
          label="密码"
          type="password"
          icon={<LockIcon />}
          placeholder="请输入密码"
          autoComplete="current-password"
          value={password}
          error={errors.password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((current) => ({ ...current, password: undefined }));
          }}
        />

        <div className={styles.formMeta}>
          <Link to="/auth/forgot-password">忘记密码？</Link>
        </div>

        <button className={styles.primaryButton} type="submit" disabled={submitting}>
          {submitting ? <span className={styles.spinner} /> : "登录"}
        </button>
      </form>
    </AuthLayout>
  );
}
