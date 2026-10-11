"use client";

import { WorkspaceShell } from "@/components/new/WorkspaceShell";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
