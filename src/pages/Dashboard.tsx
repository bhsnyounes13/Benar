import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import ClientOverview from "@/pages/dashboard/ClientOverview";

export default function Dashboard() {
  const { roles } = useAuth();

  // For now, show client overview. Will add freelancer/admin views later.
  return (
    <DashboardLayout>
      <ClientOverview />
    </DashboardLayout>
  );
}
