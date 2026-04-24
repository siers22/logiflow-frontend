import { MultiRoleAuthGuard } from "@/components/AuthGuard";
import { WarehousesPage } from "@/components/pages/WarehousesPage";

export const metadata = { title: "Склады — LogiFlow" };

export default function Page() {
  return (
    <MultiRoleAuthGuard allowedRoles={["admin", "manager"]}>
      <WarehousesPage />
    </MultiRoleAuthGuard>
  );
}
