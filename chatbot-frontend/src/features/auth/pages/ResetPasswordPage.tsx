import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { ArrowLeftIcon, CheckIcon, LockIcon } from "../components/Icons";
import { StatusMessage } from "../components/StatusMessage";
import { validatePassword, type FieldErrors } from "../utils/validation";
import styles from "../styles/Auth.module.less";

type ResetField = "password" | "confirmPassword";

interface ResetLocationState {
  resetToken?: string;
}

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const resetToken = (location.state as ResetLocationState | null)?.resetToken;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors<ResetField>>({});
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors<ResetField> = {
      password: validatePassword(password),
    };
    if (!confirmPassword) nextErrors.confirmPassword = "请再次输入新密码";
    else if (password !== confirmPassword) nextErrors.confirmPassword = "两次输入的密码不一致";
    setErrors(nextErrors);
    setRequestError("");
    if (Object.values(nextErrors).some(Boolean) || !resetToken) return;

    setSubmitting(true);
    try {
      await authApi.resetPassword({ resetToken, newPassword: password });
      setCompleted(true);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "密码重置失败");
    } finally {
      setSubmitting(false);
    }
  }

  if (!resetToken) {
    return (
      <AuthLayout
        eyebrow="链接失效"
        title="请重新验证身份"
        description="当前没有有效的密码重置凭证，请返回找回密码页面。"
        compact
      >
        <Link className={styles.primaryButton} to="/auth/forgot-password">
          重新验证
        </Link>
      </AuthLayout>
    );
  }

  if (completed) {
    return (
      <AuthLayout
        eyebrow="修改完成"
        title="密码已重新设置"
        description="请使用新密码登录你的账号。"
        compact
      >
        <div className={styles.successPanel}>
          <span className={styles.successIcon}>
            <CheckIcon />
          </span>
          <p>为了账号安全，其他设备上的登录状态可能需要重新验证。</p>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => navigate("/auth/login", { replace: true })}
          >
            返回登录
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="最后一步"
      title="设置新密码"
      description="新密码需为 8–16 位，并至少包含两类字符。"
      compact
      footer={
        <Link className={styles.backLink} to="/auth/login">
          <ArrowLeftIcon /> 返回登录
        </Link>
      }
    >
      <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
        {requestError && <StatusMessage type="error">{requestError}</StatusMessage>}
        <FormField
          label="新密码"
          type="password"
          icon={<LockIcon />}
          placeholder="请输入新密码"
          autoComplete="new-password"
          value={password}
          error={errors.password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((current) => ({ ...current, password: undefined }));
          }}
        />
        <FormField
          label="确认新密码"
          type="password"
          icon={<LockIcon />}
          placeholder="请再次输入新密码"
          autoComplete="new-password"
          value={confirmPassword}
          error={errors.confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setErrors((current) => ({ ...current, confirmPassword: undefined }));
          }}
        />
        <button className={styles.primaryButton} type="submit" disabled={submitting}>
          {submitting ? <span className={styles.spinner} /> : "确认修改"}
        </button>
      </form>
    </AuthLayout>
  );
}
