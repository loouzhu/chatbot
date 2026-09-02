import { useEffect, useState, type FormEvent } from "react";
import {
  KeyOutlined,
  LockOutlined,
  MailOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Segmented } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
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
  const [successNotice, setSuccessNotice] = useState(successMessage ?? "");

  useEffect(() => {
    setSuccessNotice(successMessage ?? "");
  }, [successMessage]);

  useEffect(() => {
    if (!successNotice && !requestError) return;
    const timer = setTimeout(() => {
      setSuccessNotice("");
      setRequestError("");
    }, 3000);
    return () => clearTimeout(timer);
  }, [successNotice, requestError]);

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
      setRequestError(
        error instanceof Error ? error.message : "账号或密码错误",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
      {successNotice && (
        <StatusMessage type="success">{successNotice}</StatusMessage>
      )}
      {requestError && (
        <StatusMessage type="error">{requestError}</StatusMessage>
      )}

      <FormField
        label="账号"
        icon={<UserOutlined />}
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
        icon={<LockOutlined />}
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

      <Button
        className={styles.primaryButton}
        type="primary"
        htmlType="submit"
        loading={submitting}
        block
      >
        登录
      </Button>
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

  useEffect(() => {
    if (!notice && !requestError) return;
    const timer = setTimeout(() => {
      setNotice("");
      setRequestError("");
    }, 2000);
    return () => clearTimeout(timer);
  }, [notice, requestError]);

  async function handleSendCode() {
    const emailError = validateEmail(email);
    setErrors((current) => ({ ...current, email: emailError }));
    setNotice("");
    setRequestError("");
    if (emailError || !verification.canSend) return;

    try {
      setCodeSentTo(email.trim());
      setNotice("验证码已发送，请前往邮箱查看");
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "验证码发送失败，请稍后重试",
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors<EmailCodeField> = {
      email: validateEmail(email),
      verifyCode: validateEmailCode(verifyCode),
    };
    if (!verification.challenge) nextErrors.verifyCode = "请先获取邮箱验证码";
    else if (codeSentTo !== email.trim())
      nextErrors.verifyCode = "邮箱已更改，请重新获取验证码";
    setErrors(nextErrors);
    setRequestError("");
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      await authApi.loginWithEmailCode({ email: email.trim(), verifyCode });
      navigate("/chat", { replace: true });
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "邮箱或验证码错误",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
      {successMessage && (
        <StatusMessage type="success">{successMessage}</StatusMessage>
      )}
      {requestError && (
        <StatusMessage type="error">{requestError}</StatusMessage>
      )}
      {notice && <StatusMessage type="info">{notice}</StatusMessage>}

      <FormField
        label="邮箱"
        type="email"
        icon={<MailOutlined />}
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
        icon={<KeyOutlined />}
        placeholder="请输入 6 位验证码"
        autoComplete="one-time-code"
        value={verifyCode}
        error={errors.verifyCode}
        onChange={(event) => {
          setVerifyCode(event.target.value.replace(/\D/g, ""));
          setErrors((current) => ({ ...current, verifyCode: undefined }));
        }}
        trailing={
          <Button
            className={styles.codeButton}
            onClick={() => void handleSendCode()}
            disabled={!verification.canSend}
            size="small"
          >
            {verification.sending
              ? "发送中"
              : verification.countdown > 0
                ? `${verification.countdown}s`
                : "获取验证码"}
          </Button>
        }
      />

      <div
        className={`${styles.formMeta} ${styles.formMetaPlaceholder}`}
        aria-hidden="true"
      />

      <Button
        className={styles.primaryButton}
        type="primary"
        htmlType="submit"
        loading={submitting}
        block
      >
        登录
      </Button>
    </form>
  );
}

export function LoginPage() {
  const location = useLocation();
  const successMessage = (location.state as { message?: string } | null)
    ?.message;
  const [mode, setMode] = useState<LoginMode>("password");

  return (
    <AuthLayout
      eyebrow=""
      title="登录"
      description=""
      compact
      footer={
        <p>
          还没有账号？ <Link to="/auth/register">立即注册</Link>
        </p>
      }
    >
      <Segmented<LoginMode>
        className={styles.loginMethodTabs}
        block
        aria-label="登录方式"
        options={[
          { label: "账号密码", value: "password" },
          { label: "邮箱验证码", value: "emailCode" },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === "password" ? (
        <PasswordLoginForm successMessage={successMessage} />
      ) : (
        <EmailCodeLoginForm successMessage={successMessage} />
      )}
    </AuthLayout>
  );
}
