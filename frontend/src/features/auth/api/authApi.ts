import type {
  EmailCodeLoginInput,
  LoginResponse,
  PasswordLoginInput,
  PasswordResetVerification,
  RegisterInput,
  ResetPasswordInput,
  SendVerifyCodeResponse,
} from "../types";
import { request } from "@shared/utils/request";

export const authApi = {
  // 账密登录
  async loginWithPassword(input: PasswordLoginInput) {
    return request<LoginResponse>("/auth/login/username", {
      body: { username: input.username, password: input.password },
    });
  },

  // 验证码登录
  async loginWithEmailCode(input: EmailCodeLoginInput) {
    return request<LoginResponse>("/auth/login/email", {
      body: { email: input.email, verify_code: input.verifyCode },
    });
  },

  // 发送登录验证码
  async requestLoginCode(email: string): Promise<SendVerifyCodeResponse> {
    return request<SendVerifyCodeResponse>("/auth/verify_code", {
      body: { email, username: email, purpose: "login" },
    });
  },

  // 发送注册验证码
  async requestRegistrationCode(
    email: string,
    username: string,
  ): Promise<SendVerifyCodeResponse> {
    return request<SendVerifyCodeResponse>("/auth/verify_code", {
      body: { email, username, purpose: "register" },
    });
  },

  // 注册
  async register(input: RegisterInput): Promise<void> {
    return request<void>("/auth/register", {
      body: {
        email: input.email,
        username: input.username,
        password: input.password,
        confirm_password: input.confirmPassword,
        verify_code: input.verifyCode,
      },
    });
  },

  // 密码重置
  // async requestPasswordReset(
  //   email: string,
  //   username: string,
  // ): Promise<VerificationChallenge> {
  //   return request<VerificationChallenge>("/auth/password-reset/code", {
  //     body: { email, username },
  //   });
  // },

  // 验证密码重置
  async verifyPasswordReset(
    verificationId: string,
    emailCode: string,
  ): Promise<PasswordResetVerification> {
    return request<PasswordResetVerification>("/auth/password-reset/verify", {
      body: { verificationId, emailCode },
    });
  },

  // 重置密码
  async resetPassword(input: ResetPasswordInput): Promise<void> {
    return request<void>("/auth/password-reset/complete", { body: input });
  },

  // 退出登陆
  async logout() {
    return request("/auth/logout", { auth: true });
  },
};
