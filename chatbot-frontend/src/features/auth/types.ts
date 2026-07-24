export interface LoginInput {
  account: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  emailCode: string;
  verificationId: string;
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

export interface VerificationChallenge {
  verificationId: string;
  expiresIn: number;
  developmentCode?: string;
}

export interface PasswordResetVerification {
  resetToken: string;
}

export interface ResetPasswordInput {
  resetToken: string;
  newPassword: string;
}
