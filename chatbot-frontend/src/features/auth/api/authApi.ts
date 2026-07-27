import type {
  AuthSession,
  EmailCodeLoginInput,
  PasswordLoginInput,
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

  const payload = (await response.json().catch(() => null)) as {
    detail?: string;
    message?: string;
  } | null;

  if (!response.ok) {
    throw new AuthApiError(payload?.message ?? payload?.detail ?? "请求失败，请稍后重试");
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

export const authApi = {
  async loginWithPassword(input: PasswordLoginInput): Promise<AuthSession> {
    if (!USE_AUTH_MOCK) {
      const response = await request<{ username: string; message: string }>(
        "/auth/login/username",
        { username: input.username, password: input.password },
      );
      return {
        user: { id: response.username, email: "", username: response.username },
        accessToken: "development-session",
      };
    }

    await wait();
    return {
      user: { id: "demo-user", email: "demo@example.com", username: input.username },
      accessToken: "development-session",
    };
  },

  async loginWithEmailCode(input: EmailCodeLoginInput): Promise<AuthSession> {
    if (!USE_AUTH_MOCK) {
      const response = await request<{ email: string; message: string }>(
        "/auth/login/email",
        { email: input.email, verify_code: input.verifyCode },
      );
      return {
        user: {
          id: response.email,
          email: response.email,
          username: response.email.split("@")[0],
        },
        accessToken: "development-session",
      };
    }

    await wait();
    if (input.verifyCode !== DEVELOPMENT_CODE) {
      throw new AuthApiError("验证码错误，请重新输入");
    }
    return {
      user: {
        id: "demo-user",
        email: input.email,
        username: input.email.split("@")[0],
      },
      accessToken: "development-session",
    };
  },

  async requestLoginCode(email: string): Promise<VerificationChallenge> {
    if (!USE_AUTH_MOCK) {
      await request("/auth/verify_code", {
        email,
        username: email.split("@")[0],
        code: "",
        purpose: "login",
      });
      return { verificationId: `login:${email}`, expiresIn: 300 };
    }
    await wait();
    return mockChallenge("login");
  },

  async requestRegistrationCode(email: string): Promise<VerificationChallenge> {
    if (!USE_AUTH_MOCK) {
      await request("/auth/verify_code", {
        email,
        username: "user",
        code: "",
        purpose: "register",
      });
      return { verificationId: `register:${email}`, expiresIn: 300 };
    }
    await wait();
    return mockChallenge("register");
  },

  async register(input: RegisterInput): Promise<void> {
    if (!USE_AUTH_MOCK) {
      return request<void>("/auth/register", {
        email: input.email,
        username: input.username,
        password: input.password,
        confirm_password: input.confirmPassword,
        verify_code: input.verifyCode,
      });
    }
    await wait();
    if (input.verifyCode !== DEVELOPMENT_CODE) {
      throw new AuthApiError("验证码错误，请重新输入");
    }
  },

  async requestPasswordReset(email: string, username: string): Promise<VerificationChallenge> {
    if (!USE_AUTH_MOCK) {
      return request<VerificationChallenge>("/auth/password-reset/code", { email, username });
    }
    await wait();
    return mockChallenge("reset");
  },

  async verifyPasswordReset(
    verificationId: string,
    emailCode: string,
  ): Promise<PasswordResetVerification> {
    if (!USE_AUTH_MOCK) {
      return request<PasswordResetVerification>("/auth/password-reset/verify", {
        verificationId,
        emailCode,
      });
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
