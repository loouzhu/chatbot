import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const token = window.localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  return children;
}
