import { ChatPanel } from "@chat/components/ChatPanel";
import { ForgotPasswordPage } from "@auth/pages/ForgotPasswordPage";
import { LoginPage } from "@auth/pages/LoginPage";
import { RegisterPage } from "@auth/pages/RegisterPage";
import { ResetPasswordPage } from "@auth/pages/ResetPasswordPage";
import { Navigate, createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/auth/login" replace />,
  },
  {
    path: "/auth",
    element: <Navigate to="/auth/login" replace />,
  },
  {
    path: "/auth/login",
    element: <LoginPage />,
  },
  {
    path: "/auth/register",
    element: <RegisterPage />,
  },
  {
    path: "/auth/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/auth/reset-password",
    element: <ResetPasswordPage />,
  },
  {
    path: "/chat",
    element: <ChatPanel />,
  },
  {
    path: "*",
    element: <Navigate to="/auth/login" replace />,
  },
]);
