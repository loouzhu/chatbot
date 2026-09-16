import { ChatPanel } from "@/features/chat/pages";
import { RequireAuth } from "./components/RequireAuth";
import { ForgotPasswordPage } from "@auth/pages/forgot-password";
import { LoginPage } from "@auth/pages/login";
import { RegisterPage } from "@auth/pages/register";
import { ResetPasswordPage } from "@auth/pages/reset-password";
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
    element: (
      <RequireAuth>
        <ChatPanel />
      </RequireAuth>
    ),
  },
  {
    path: "/chat/:conversation_id",
    element: (
      <RequireAuth>
        <ChatPanel />
      </RequireAuth>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/auth/login" replace />,
  },
]);
