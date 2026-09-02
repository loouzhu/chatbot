import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import type {
  EmailCodeLoginInput,
  PasswordLoginInput,
  PasswordResetVerification,
  RegisterInput,
  ResetPasswordInput,
} from "../types";

class AuthApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthApiError";
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AuthApiError || error instanceof Error) {
    return error.message;
  }
  return "请求失败，请稍后重试";
}

export const useLoginWithPassword = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (input: PasswordLoginInput) => authApi.loginWithPassword(input),
    onSuccess: () => {
      navigate("/chat", { replace: true });
    },
    onError: (error: unknown) => {
      console.error(getErrorMessage(error));
    },
  });
};

export const useLoginWithEmailCode = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (input: EmailCodeLoginInput) =>
      authApi.loginWithEmailCode(input),
    onSuccess: () => {
      navigate("/chat", { replace: true });
    },
    onError: (error: unknown) => {
      console.error(getErrorMessage(error));
    },
  });
};

export const useRequestLoginCode = () => {
  return useMutation({
    mutationFn: (email: string) => authApi.requestLoginCode(email),
    onSuccess: () => {},
    onError: (error: unknown) => {
      console.error(getErrorMessage(error));
    },
  });
};

export const useRequestRegistrationCode = () => {
  return useMutation({
    mutationFn: (email: string) => authApi.requestRegistrationCode(email),
    onSuccess: () => {},
    onError: (error: unknown) => {
      console.error(getErrorMessage(error));
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: () => {},
    onError: (error: unknown) => {
      console.error(getErrorMessage(error));
    },
  });
};

export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: ({ email, username }: { email: string; username: string }) =>
      authApi.requestPasswordReset(email, username),
    onSuccess: () => {},
    onError: (error: unknown) => {
      console.error(getErrorMessage(error));
    },
  });
};

export const useVerifyPasswordReset = () => {
  return useMutation({
    mutationFn: ({
      verificationId,
      emailCode,
    }: {
      verificationId: string;
      emailCode: string;
    }) => authApi.verifyPasswordReset(verificationId, emailCode),
    onSuccess: () => {},
    onError: (error: unknown) => {
      console.error(getErrorMessage(error));
    },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => authApi.resetPassword(input),
    onSuccess: () => {},
    onError: (error: unknown) => {
      console.error(getErrorMessage(error));
    },
  });
};

export type { PasswordResetVerification };
