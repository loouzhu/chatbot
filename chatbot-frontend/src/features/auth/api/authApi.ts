import type {
  AuthSession,
  LoginInput,
  PasswordResetVerification,
  RegisterInput,
  ResetPasswordInput,
  VerificationChallenge,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const USE_AUTH_MOCK = import.meta.env.VITE_USE_AUTH_MOCK !== "false";
const DEVELOPMENT_CODE = "123456";

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

  const payload = (await response.json().catch(() => null)) as
    | { detail?: string; message?: string }
    | null;

  if (!response.ok) {
    throw new AuthApiError(
      payload?.message ?? payload?.detail ?? "请求失败，请稍后重试",
    );
  }

  return payload as T;
}

function wait(duration = 550): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

function mockChallenge(prefix: string): VerificationChallenge {
  return {
    verificationId: `${prefix}_${crypto.randomUUID()}`,
    expiresIn: 300,
    developmentCode: DEVELOPMENT_CODE,
  };
}

/**
 * Authentication transport boundary.
 *
 * The mock adapter is enabled by default so the UI can be reviewed before the
 * backend and email provider are ready. Set VITE_USE_AUTH_MOCK=false to use the
 * reserved HTTP endpoints below without changing page components.
 */
export const authApi = {
  async login(input: LoginInput): Promise<AuthSession> {
    if (!USE_AUTH_MOCK) return request<AuthSession>("/auth/login", input);
    await wait();
    return {
      user: {
        id: "demo-user",
        email: input.account.includes("@") ? input.account : "demo@example.com",
        username: input.account.includes("@") ? "演示用户" : input.account,
      },
      accessToken: "development-session",
    };
  },

  async requestRegistrationCode(email: string): Promise<VerificationChallenge> {
    if (!USE_AUTH_MOCK) {
      return request<VerificationChallenge>("/auth/register/code", { email });
    }
    await wait();
    return mockChallenge("register");
  },

  async register(input: RegisterInput): Promise<void> {
    if (!USE_AUTH_MOCK) return request<void>("/auth/register", input);
    await wait();
    if (input.emailCode !== DEVELOPMENT_CODE) {
      throw new AuthApiError("验证码错误，请重新输入");
    }
  },

  async requestPasswordReset(
    email: string,
    username: string,
  ): Promise<VerificationChallenge> {
    if (!USE_AUTH_MOCK) {
      return request<VerificationChallenge>("/auth/password-reset/code", {
        email,
        username,
      });
    }
    await wait();
    return mockChallenge("reset");
  },

  async verifyPasswordReset(
    verificationId: string,
    emailCode: string,
  ): Promise<PasswordResetVerification> {
    if (!USE_AUTH_MOCK) {
      return request<PasswordResetVerification>(
        "/auth/password-reset/verify",
        { verificationId, emailCode },
      );
    }
    await wait();
    if (emailCode !== DEVELOPMENT_CODE) {
      throw new AuthApiError("验证码错误，请重新输入");
    }
    return { resetToken: `reset_token_${crypto.randomUUID()}` };
  },

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    if (!USE_AUTH_MOCK) {
      return request<void>("/auth/password-reset/complete", input);
    }
    await wait();
    if (!input.resetToken) throw new AuthApiError("重置凭证已失效，请重新验证");
  },
};

export const authRuntime = {
  isMock: USE_AUTH_MOCK,
};
