"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (!user || user.role !== allowedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return <>{children}</>;
}
