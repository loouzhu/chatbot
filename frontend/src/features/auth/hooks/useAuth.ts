import { useMutation } from "@tanstack/react-query";
import { useMessageApi } from "../../../app/context";
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
  const messageApi = useMessageApi();
  return useMutation({
    mutationFn: (input: PasswordLoginInput) => authApi.loginWithPassword(input),
    onSuccess: () => {
      messageApi.success("登录成功");
      navigate("/chat", { replace: true });
    },
    onError: (error: unknown) => {
      messageApi.error(getErrorMessage(error));
    },
  });
};

export const useLoginWithEmailCode = () => {
  const navigate = useNavigate();
  const messageApi = useMessageApi();

  return useMutation({
    mutationFn: (input: EmailCodeLoginInput) =>
      authApi.loginWithEmailCode(input),
    onSuccess: () => {
      messageApi.success("登录成功");
      navigate("/chat", { replace: true });
    },
    onError: (error: unknown) => {
      messageApi.error(getErrorMessage(error));
    },
  });
};

export const useRequestLoginCode = () => {
  const messageApi = useMessageApi();

  return useMutation({
    mutationFn: (email: string) => authApi.requestLoginCode(email),
    onSuccess: () => {
      messageApi.success("验证码已发送");
    },
    onError: (error: unknown) => {
      messageApi.error(getErrorMessage(error));
    },
  });
};

export const useRequestRegistrationCode = () => {
  const messageApi = useMessageApi();

  return useMutation({
    mutationFn: (email: string) => authApi.requestRegistrationCode(email),
    onSuccess: () => {
      messageApi.success("验证码已发送");
    },
    onError: (error: unknown) => {
      messageApi.error(getErrorMessage(error));
    },
  });
};

export const useRegister = () => {
  const messageApi = useMessageApi();

  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: () => {
      messageApi.success("注册成功");
    },
    onError: (error: unknown) => {
      messageApi.error(getErrorMessage(error));
    },
  });
};

export const useRequestPasswordReset = () => {
  const messageApi = useMessageApi();

  return useMutation({
    mutationFn: ({ email, username }: { email: string; username: string }) =>
      authApi.requestPasswordReset(email, username),
    onSuccess: () => {
      messageApi.success("重置链接已发送");
    },
    onError: (error: unknown) => {
      messageApi.error(getErrorMessage(error));
    },
  });
};

export const useVerifyPasswordReset = () => {
  const messageApi = useMessageApi();

  return useMutation({
    mutationFn: ({
      verificationId,
      emailCode,
    }: {
      verificationId: string;
      emailCode: string;
    }) => authApi.verifyPasswordReset(verificationId, emailCode),
    onSuccess: () => {
      messageApi.success("验证成功");
    },
    onError: (error: unknown) => {
      messageApi.error(getErrorMessage(error));
    },
  });
};

export const useResetPassword = () => {
  const messageApi = useMessageApi();

  return useMutation({
    mutationFn: (input: ResetPasswordInput) => authApi.resetPassword(input),
    onSuccess: () => {
      messageApi.success("密码重置成功");
    },
    onError: (error: unknown) => {
      messageApi.error(getErrorMessage(error));
    },
  });
};

export type { PasswordResetVerification };
