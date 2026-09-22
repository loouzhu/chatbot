export interface PasswordLoginInput {
  username: string;
  password: string;
}

export interface EmailCodeLoginInput {
  email: string;
  verifyCode: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  verifyCode: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken?: string;
}

export interface SendVerifyCodeResponse {
  message: string;
  code: string;
}

export interface PasswordResetVerification {
  resetToken: string;
}

export interface ResetPasswordInput {
  resetToken: string;
  newPassword: string;
}

export interface TokenResponse {
  id: string;
  token: string;
  created_at: string;
}

export interface UserInfo {
  email: string;
  username: string;
  status: string;
  created_at: string;
}
export interface LoginResponse {
  code: string;
  message: string;
  token: TokenResponse;
  user: UserInfo;
}
