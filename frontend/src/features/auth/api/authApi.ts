import type {
  EmailCodeLoginInput,
  PasswordLoginInput,
  PasswordResetVerification,
  RegisterInput,
  ResetPasswordInput,
  VerificationChallenge,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://101.37.70.188:8000";

export class AuthApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthApiError";
  }
}

async function request<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as {
    detail?: string;
    message?: string;
  } | null;

  if (!response.ok) {
    throw new AuthApiError(
      payload?.message ?? payload?.detail ?? "请求失败，请稍后重试",
    );
  }

  return payload as T;
}

export const authApi = {
  async loginWithPassword(input: PasswordLoginInput) {
    return await request<{ username: string; message: string }>(
      "/auth/login/username",
      { username: input.username, password: input.password },
    );
  },

  async loginWithEmailCode(input: EmailCodeLoginInput) {
    return await request<{ email: string; message: string }>(
      "/auth/login/email",
      { email: input.email, verify_code: input.verifyCode },
    );
  },

  async requestLoginCode(email: string) {
    return await request("/auth/verify_code", {
      email,
      username: email,
      purpose: "login",
    });
  },

  async requestRegistrationCode(email: string) {
    return await request("/auth/verify_code", {
      email,
      username: "user",
      purpose: "register",
    });
  },

  async register(input: RegisterInput): Promise<void> {
    return await request<void>("/auth/register", {
      email: input.email,
      username: input.username,
      password: input.password,
      confirm_password: input.confirmPassword,
      verify_code: input.verifyCode,
    });
  },

  async requestPasswordReset(
    email: string,
    username: string,
  ): Promise<VerificationChallenge> {
    return request<VerificationChallenge>("/auth/password-reset/code", {
      email,
      username,
    });
  },

  async verifyPasswordReset(
    verificationId: string,
    emailCode: string,
  ): Promise<PasswordResetVerification> {
    return request<PasswordResetVerification>("/auth/password-reset/verify", {
      verificationId,
      emailCode,
    });
  },

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    return request<void>("/auth/password-reset/complete", input);
  },
};
