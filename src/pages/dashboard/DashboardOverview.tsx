import { useAuth } from "@/contexts/AuthContext";
import ClientOverview from "./ClientOverview";
import FreelancerOverview from "./FreelancerOverview";
import ClientProposals from "./ClientProposals";
import ClientContracts from "./ClientContracts";
import FreelancerProposals from "./FreelancerProposals";
import FreelancerContracts from "./FreelancerContracts";

interface Props {
  section?: "proposals" | "contracts";
}

export default function DashboardOverview({ section }: Props) {
  const { roles } = useAuth();
  const isClient = roles.includes("client");

  // If a specific section is requested, route to the right role-specific component
  if (section === "proposals") {
    return isClient ? <ClientProposals /> : <FreelancerProposals />;
  }
  if (section === "contracts") {
    return isClient ? <ClientContracts /> : <FreelancerContracts />;
  }

  // Default overview
  return isClient ? <ClientOverview /> : <FreelancerOverview />;
}
