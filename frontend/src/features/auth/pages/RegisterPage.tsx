import { useState, type FormEvent } from "react";
import {
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { StatusMessage } from "../components/StatusMessage";
import { useVerificationCode } from "../hooks/useVerificationCode";
import {
  validateEmail,
  validateEmailCode,
  validatePassword,
  validateUsername,
  type FieldErrors,
} from "../utils/validation";
import styles from "../styles/Auth.module.less";

type RegisterField =
  | "email"
  | "username"
  | "password"
  | "confirmPassword"
  | "emailCode";

export function RegisterPage() {
  const navigate = useNavigate();
  const verification = useVerificationCode();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [errors, setErrors] = useState<FieldErrors<RegisterField>>({});
  const [notice, setNotice] = useState("");
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSendCode() {
    const emailError = validateEmail(email);
    setErrors((current) => ({ ...current, email: emailError }));
    setRequestError("");
    if (emailError || !verification.canSend) return;

    try {
      await verification.send(() =>
        authApi.requestRegistrationCode(email.trim()),
      );
      setNotice("验证码已发送，请前往邮箱查看");
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "验证码发送失败",
      );
    }
  }

  function validate(): FieldErrors<RegisterField> {
    const nextErrors: FieldErrors<RegisterField> = {
      email: validateEmail(email),
      username: validateUsername(username),
      password: validatePassword(password),
      emailCode: validateEmailCode(emailCode),
    };
    if (!confirmPassword) nextErrors.confirmPassword = "请再次输入密码";
    else if (password !== confirmPassword)
      nextErrors.confirmPassword = "两次输入的密码不一致";
    if (!verification.challenge) nextErrors.emailCode = "请先获取邮箱验证码";
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
      await authApi.register({
        email: email.trim(),
        username: username.trim(),
        password,
        confirmPassword,
        verifyCode: emailCode,
      });
      navigate("/auth/login", {
        replace: true,
        state: { message: "注册成功，请使用新账号登录" },
      });
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "注册失败，请稍后重试",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const clearError = (field: RegisterField) =>
    setErrors((current) => ({ ...current, [field]: undefined }));

  return (
    <AuthLayout
      eyebrow=""
      title="创建账号"
      description=""
      footer={
        <p>
          已有账号？ <Link to="/auth/login">返回登录</Link>
        </p>
      }
    >
      <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
        {requestError && (
          <StatusMessage type="error">{requestError}</StatusMessage>
        )}
        {notice && <StatusMessage type="info">{notice}</StatusMessage>}

        <FormField
          label="邮箱地址"
          type="email"
          icon={<MailOutlined />}
          placeholder="name@example.com"
          autoComplete="email"
          value={email}
          error={errors.email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearError("email");
          }}
        />
        <FormField
          label="用户名"
          icon={<UserOutlined />}
          placeholder="3–8 位中文、英文或数字"
          autoComplete="username"
          value={username}
          error={errors.username}
          onChange={(event) => {
            setUsername(event.target.value);
            clearError("username");
          }}
        />
        <FormField
          label="设置密码"
          type="password"
          icon={<LockOutlined />}
          placeholder="8–64位字符"
          autoComplete="new-password"
          value={password}
          error={errors.password}
          onChange={(event) => {
            setPassword(event.target.value);
            clearError("password");
          }}
        />
        <FormField
          label="确认密码"
          type="password"
          icon={<LockOutlined />}
          placeholder="请再次输入密码"
          autoComplete="new-password"
          value={confirmPassword}
          error={errors.confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            clearError("confirmPassword");
          }}
        />
        <FormField
          label="邮箱验证码"
          inputMode="numeric"
          maxLength={6}
          icon={<SafetyCertificateOutlined />}
          placeholder="6 位验证码"
          value={emailCode}
          error={errors.emailCode}
          onChange={(event) => {
            setEmailCode(event.target.value.replace(/\D/g, ""));
            clearError("emailCode");
          }}
          trailing={
            <Button
              className={styles.codeButton}
              onClick={handleSendCode}
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

        <Button
          className={styles.primaryButton}
          type="primary"
          htmlType="submit"
          loading={submitting}
          block
        >
          创建账号
        </Button>
        <p className={styles.terms}>注册即表示你同意服务条款与隐私政策</p>
      </form>
    </AuthLayout>
  );
}
