import { useMutation } from "@tanstack/react-query";
import { useMessageApi } from "@/app/context";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import type {
  EmailCodeLoginInput,
  PasswordLoginInput,
  RegisterInput,
  ResetPasswordInput,
  LoginResponse,
} from "../types";
import { getErrorMessage } from "@/features/shared/utils/request";

export const useLoginWithPassword = () => {
  const navigate = useNavigate();
  const messageApi = useMessageApi();
  return useMutation({
    mutationFn: (input: PasswordLoginInput) => authApi.loginWithPassword(input),
    onSuccess: (data: LoginResponse) => {
      console.log(data);
      localStorage.setItem("token", data.token.token);
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
    onSuccess: (data: LoginResponse) => {
      messageApi.success("登录成功");
      localStorage.setItem("token", data.token.token);
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
    mutationFn: ({ email, username }: { email: string; username: string }) =>
      authApi.requestRegistrationCode(email, username),
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

  // return useMutation({
  //   mutationFn: ({ email, username }: { email: string; username: string }) =>
  //     // authApi.requestPasswordReset(email, username),
  //   {},
  //   onSuccess: () => {
  //     messageApi.success("重置链接已发送");
  //   },
  //   onError: (error: unknown) => {
  //     messageApi.error(getErrorMessage(error));
  //   },
  // });
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

export const useLogout = () => {
  const navigate = useNavigate();
  const messageApi = useMessageApi();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      window.localStorage.removeItem("token");
      messageApi.success("退出登录成功");
      navigate("/auth/login", { replace: true });
    },
    onError: (error: Error) => {
      messageApi.error(getErrorMessage(error));
    },
  });
};
