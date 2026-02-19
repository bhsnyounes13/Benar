import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import CreateProject from "./pages/dashboard/CreateProject";
import ClientProjects from "./pages/dashboard/ClientProjects";
import ClientProposals from "./pages/dashboard/ClientProposals";
import ClientContracts from "./pages/dashboard/ClientContracts";
import BrowseProjects from "./pages/dashboard/BrowseProjects";
import HireFreelancers from "./pages/dashboard/HireFreelancers";
import FreelancerProposals from "./pages/dashboard/FreelancerProposals";
import FreelancerContracts from "./pages/dashboard/FreelancerContracts";
import WalletPage from "./pages/dashboard/WalletPage";
import ContractMessages from "./pages/dashboard/ContractMessages";
import ProfilePage from "./pages/dashboard/ProfilePage";
import ContractDetail from "./pages/dashboard/ContractDetail";

const queryClient = new QueryClient();

function DashboardPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Dashboard - role-aware overview */}
            <Route path="/dashboard" element={<DashboardPage><DashboardOverview /></DashboardPage>} />

            {/* Client routes */}
            <Route path="/dashboard/projects/new" element={<DashboardPage><CreateProject /></DashboardPage>} />
            <Route path="/dashboard/projects" element={<DashboardPage><ClientProjects /></DashboardPage>} />

            {/* Shared routes that show different content based on role */}
            <Route path="/dashboard/proposals" element={<DashboardPage><DashboardOverview section="proposals" /></DashboardPage>} />
            <Route path="/dashboard/contracts" element={<DashboardPage><DashboardOverview section="contracts" /></DashboardPage>} />
            <Route path="/dashboard/contracts/:id" element={<DashboardPage><ContractDetail /></DashboardPage>} />

            {/* Messaging */}
            <Route path="/dashboard/messages" element={<DashboardPage><ContractMessages /></DashboardPage>} />

            {/* Freelancer routes */}
            <Route path="/dashboard/browse" element={<DashboardPage><BrowseProjects /></DashboardPage>} />
            <Route path="/dashboard/hire" element={<DashboardPage><HireFreelancers /></DashboardPage>} />
            <Route path="/dashboard/wallet" element={<DashboardPage><WalletPage /></DashboardPage>} />
            <Route path="/dashboard/profile" element={<DashboardPage><ProfilePage /></DashboardPage>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
