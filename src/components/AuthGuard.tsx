"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import type { UserRole } from "@/types";

interface AuthGuardProps {
  allowedRole: UserRole;
  children: React.ReactNode;
}

export function AuthGuard({ allowedRole, children }: AuthGuardProps) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== allowedRole) {
      router.replace(`/dashboard/${user.role}`);
    }
  }, [user, isLoading, allowedRole, router]);

  if (isLoading || !user || user.role !== allowedRole) {
    return <DashboardSkeleton />;
  }

  return <>{children}</>;
}
