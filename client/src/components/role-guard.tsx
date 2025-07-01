import { useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role || "employee")) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
