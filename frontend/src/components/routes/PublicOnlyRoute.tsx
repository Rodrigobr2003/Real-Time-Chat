import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { SessionLoading } from "./SessionLoading";

export function PublicOnlyRoute() {
  const { user, isCheckingSession } = useAuth();

  if (isCheckingSession) return <SessionLoading />;

  if (user) return <Navigate to="/home" replace />;

  return <Outlet />;
}
