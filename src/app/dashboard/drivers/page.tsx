import { AuthGuard } from "@/components/AuthGuard";
import { DriversPage } from "@/components/pages/DriversPage";

export const metadata = { title: "Водители — LogiFlow" };

export default function Page() {
  return (
    <AuthGuard allowedRole="admin">
      <DriversPage />
    </AuthGuard>
  );
}
