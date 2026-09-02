import { useMutation } from "@tanstack/react-query";
import { message } from "antd";
import { authApi } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import type {
  EmailCodeLoginInput,
  PasswordLoginInput,
  PasswordResetVerification,
  RegisterInput,
  ResetPasswordInput,
  VerificationChallenge,
} from "../types";

class AuthApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthApiError";
  }
}

export const useLoginWithPassword = () => {
  // const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [messageApi] = message.useMessage();
  return useMutation({
    mutationFn: (input: PasswordLoginInput) => authApi.loginWithPassword(input),
    onSuccess: () => {
      navigate("/chat", { replace: true });
      messageApi.success("登录成功");
    },
    onError: (error: AuthApiError) => {
      messageApi.error(error.message);
    },
  });
};
