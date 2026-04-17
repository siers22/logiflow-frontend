import { AuthGuard } from "@/components/AuthGuard";
import { VehiclesPage } from "@/components/pages/VehiclesPage";

export const metadata = { title: "Транспортные средства — LogiFlow" };

export default function Page() {
  return (
    <AuthGuard allowedRole="admin">
      <VehiclesPage />
    </AuthGuard>
  );
}
