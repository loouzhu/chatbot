import { useState, type FormEvent } from "react";
import {
  ArrowLeftOutlined,
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
  validateUsername,
  type FieldErrors,
} from "../utils/validation";
import styles from "../styles/Auth.module.less";

type ForgotField = "email" | "username" | "emailCode";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const verification = useVerificationCode();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [errors, setErrors] = useState<FieldErrors<ForgotField>>({});
  const [notice, setNotice] = useState("");
  const [requestError, setRequestError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field: ForgotField) =>
    setErrors((current) => ({ ...current, [field]: undefined }));

  async function handleSendCode() {
    const emailError = validateEmail(email);
    const usernameError = validateUsername(username);
    setErrors((current) => ({
      ...current,
      email: emailError,
      username: usernameError,
    }));
    setRequestError("");
    if (emailError || usernameError || !verification.canSend) return;

    try {
      //const challenge = await verification.send(() =>
      //  authApi.requestPasswordReset(email.trim(), username.trim()),
      //);
      setNotice("如果账号信息匹配，验证码将发送到你的邮箱");
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "验证码发送失败",
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors<ForgotField> = {
      email: validateEmail(email),
      username: validateUsername(username),
      emailCode: verification.challenge
        ? validateEmailCode(emailCode)
        : "请先获取邮箱验证码",
    };
    setErrors(nextErrors);
    setRequestError("");
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      const result = await authApi.verifyPasswordReset(
        verification.challenge!.verificationId,
        emailCode,
      );
      navigate("/auth/reset-password", {
        state: { resetToken: result.resetToken },
      });
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "验证失败，请稍后重试",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="找回账号"
      title="忘记密码？"
      description="验证你的账号信息后，即可重新设置密码。"
      compact
      footer={
        <Link className={styles.backLink} to="/auth/login">
          <ArrowLeftOutlined /> 返回登录
        </Link>
      }
    >
      <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
        {requestError && (
          <StatusMessage type="error">{requestError}</StatusMessage>
        )}
        {notice && <StatusMessage type="info">{notice}</StatusMessage>}

        <FormField
          label="注册邮箱"
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
          placeholder="请输入你的用户名"
          autoComplete="username"
          value={username}
          error={errors.username}
          onChange={(event) => {
            setUsername(event.target.value);
            clearError("username");
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
          验证并继续
        </Button>
      </form>
    </AuthLayout>
  );
}
