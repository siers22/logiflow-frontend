import { AuthGuard } from "@/components/AuthGuard";
import { ManagersPage } from "@/components/pages/ManagersPage";

export const metadata = { title: "Менеджеры — LogiFlow" };

export default function ManagersRoute() {
  return (
    <AuthGuard allowedRole="admin">
      <ManagersPage />
    </AuthGuard>
  );
}
