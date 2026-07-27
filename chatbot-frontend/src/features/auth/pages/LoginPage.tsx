import { useState, type FormEvent } from "react";
import { KeyRound, Lock, Mail, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi, authRuntime } from "../api/authApi";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { StatusMessage } from "../components/StatusMessage";
import { useVerificationCode } from "../hooks/useVerificationCode";
import {
  validateEmail,
  validateEmailCode,
  validateUsername,
  type FieldErrors,
} from "../utils/validation";
import styles from "../styles/Auth.module.less";

type LoginMode = "password" | "emailCode";
type PasswordField = "username" | "password";
type EmailCodeField = "email" | "verifyCode";

interface LoginFormProps {
  successMessage?: string;
}

function PasswordLoginForm({ successMessage }: LoginFormProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors<PasswordField>>({});
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors<PasswordField> = {
      username: validateUsername(username),
      password: password ? undefined : "请输入密码",
    };
    setErrors(nextErrors);
    setRequestError("");
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      await authApi.loginWithPassword({ username: username.trim(), password });
      navigate("/chat", { replace: true });
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "账号或密码错误");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
      {successMessage && <StatusMessage type="success">{successMessage}</StatusMessage>}
      {requestError && <StatusMessage type="error">{requestError}</StatusMessage>}

      <FormField
        label="账号"
        icon={<UserRound />}
        placeholder="请输入用户名"
        autoComplete="username"
        value={username}
        error={errors.username}
        onChange={(event) => {
          setUsername(event.target.value);
          setErrors((current) => ({ ...current, username: undefined }));
        }}
      />
      <FormField
        label="密码"
        type="password"
        icon={<Lock />}
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
  );
}

function EmailCodeLoginForm({ successMessage }: LoginFormProps) {
  const navigate = useNavigate();
  const verification = useVerificationCode();
  const [email, setEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [codeSentTo, setCodeSentTo] = useState("");
  const [errors, setErrors] = useState<FieldErrors<EmailCodeField>>({});
  const [notice, setNotice] = useState("");
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSendCode() {
    const emailError = validateEmail(email);
    setErrors((current) => ({ ...current, email: emailError }));
    setNotice("");
    setRequestError("");
    if (emailError || !verification.canSend) return;

    try {
      const challenge = await verification.send(() => authApi.requestLoginCode(email.trim()));
      setCodeSentTo(email.trim());
      setNotice(
        authRuntime.isMock
          ? `演示验证码：${challenge.developmentCode}`
          : "验证码已发送，请前往邮箱查看",
      );
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "验证码发送失败，请稍后重试");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors<EmailCodeField> = {
      email: validateEmail(email),
      verifyCode: validateEmailCode(verifyCode),
    };
    if (!verification.challenge) nextErrors.verifyCode = "请先获取邮箱验证码";
    else if (codeSentTo !== email.trim()) nextErrors.verifyCode = "邮箱已更改，请重新获取验证码";
    setErrors(nextErrors);
    setRequestError("");
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      await authApi.loginWithEmailCode({ email: email.trim(), verifyCode });
      navigate("/chat", { replace: true });
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "邮箱或验证码错误");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
      {successMessage && <StatusMessage type="success">{successMessage}</StatusMessage>}
      {requestError && <StatusMessage type="error">{requestError}</StatusMessage>}
      {notice && <StatusMessage type="info">{notice}</StatusMessage>}

      <FormField
        label="邮箱"
        type="email"
        icon={<Mail />}
        placeholder="name@example.com"
        autoComplete="email"
        value={email}
        error={errors.email}
        onChange={(event) => {
          setEmail(event.target.value);
          setCodeSentTo("");
          setVerifyCode("");
          setNotice("");
          verification.reset();
          setErrors((current) => ({ ...current, email: undefined }));
        }}
      />
      <FormField
        label="邮箱验证码"
        inputMode="numeric"
        maxLength={6}
        icon={<KeyRound />}
        placeholder="请输入 6 位验证码"
        autoComplete="one-time-code"
        value={verifyCode}
        error={errors.verifyCode}
        onChange={(event) => {
          setVerifyCode(event.target.value.replace(/\D/g, ""));
          setErrors((current) => ({ ...current, verifyCode: undefined }));
        }}
        trailing={
          <button
            className={styles.codeButton}
            type="button"
            onClick={() => void handleSendCode()}
            disabled={!verification.canSend}
          >
            {verification.sending
              ? "发送中"
              : verification.countdown > 0
                ? `${verification.countdown}s`
                : "获取验证码"}
          </button>
        }
      />

      <div
        className={`${styles.formMeta} ${styles.formMetaPlaceholder}`}
        aria-hidden="true"
      />

      <button className={styles.primaryButton} type="submit" disabled={submitting}>
        {submitting ? <span className={styles.spinner} /> : "登录"}
      </button>
    </form>
  );
}

export function LoginPage() {
  const location = useLocation();
  const successMessage = (location.state as { message?: string } | null)?.message;
  const [mode, setMode] = useState<LoginMode>("password");

  return (
    <AuthLayout
      eyebrow="欢迎回来"
      title="登录 BlueChat"
      description="选择适合你的方式，继续智能对话。"
      compact
      footer={
        <p>
          还没有账号？ <Link to="/auth/register">立即注册</Link>
        </p>
      }
    >
      <div className={styles.loginMethodTabs} role="tablist" aria-label="登录方式">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "password"}
          className={mode === "password" ? styles.active : ""}
          onClick={() => setMode("password")}
        >
          账号密码
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "emailCode"}
          className={mode === "emailCode" ? styles.active : ""}
          onClick={() => setMode("emailCode")}
        >
          邮箱验证码
        </button>
      </div>

      {mode === "password" ? (
        <PasswordLoginForm successMessage={successMessage} />
      ) : (
        <EmailCodeLoginForm successMessage={successMessage} />
      )}
    </AuthLayout>
  );
}
