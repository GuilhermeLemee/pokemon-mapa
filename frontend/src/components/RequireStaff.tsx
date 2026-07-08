import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { STAFF_ROLES } from "../lib/types";

export function RequireStaff({ children }: { children: React.ReactNode }) {
  const { player } = useAuth();
  if (!player || !STAFF_ROLES.includes(player.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
