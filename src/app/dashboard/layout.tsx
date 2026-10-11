import { WorkspaceProvider } from '@/lib/WorkspaceContext';
export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}
