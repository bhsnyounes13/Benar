import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderPlus,
  FileText,
  Handshake,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  Search,
  Palette,
  Megaphone,
  Briefcase,
  Wallet,
  MessageSquare,
  Users,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const clientNav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Create Project", href: "/dashboard/projects/new", icon: FolderPlus },
  { label: "My Projects", href: "/dashboard/projects", icon: FileText },
  { label: "Hire Freelancers", href: "/dashboard/hire", icon: Users },
  { label: "Proposals", href: "/dashboard/proposals", icon: FileText },
  { label: "Contracts", href: "/dashboard/contracts", icon: Handshake },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
];

const freelancerNav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Browse Projects", href: "/dashboard/browse", icon: Search },
  { label: "My Proposals", href: "/dashboard/proposals", icon: FileText },
  { label: "Contracts", href: "/dashboard/contracts", icon: Handshake },
  { label: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
];

const adminNav: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/users", icon: User },
  { label: "Projects", href: "/dashboard/projects", icon: FileText },
  { label: "Contracts", href: "/dashboard/contracts", icon: Handshake },
];

function getRoleIcon(roles: string[]) {
  if (roles.includes("admin")) return Briefcase;
  if (roles.includes("designer")) return Palette;
  if (roles.includes("media_buyer")) return Megaphone;
  return Briefcase;
}

function getRoleLabel(roles: string[]) {
  if (roles.includes("admin")) return "Admin";
  if (roles.includes("designer")) return "Designer";
  if (roles.includes("media_buyer")) return "Media Buyer";
  return "Client";
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, roles, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isClient = roles.includes("client");
  const isAdmin = roles.includes("admin");
  const navItems = isAdmin ? adminNav : isClient ? clientNav : freelancerNav;
  const RoleIcon = getRoleIcon(roles);
  const roleLabel = getRoleLabel(roles);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = user?.user_metadata?.full_name || user?.email || "User";

  return (
    <div className="min-h-screen flex bg-secondary/30">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
          <Link to="/" className="font-display text-xl font-bold text-sidebar-foreground">
            Ad<span className="text-sidebar-primary">Connect</span>
          </Link>
          <button className="lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
              <RoleIcon className="h-4 w-4 text-sidebar-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-sidebar-foreground/60">{roleLabel}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
          <Link
            to="/dashboard/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <User className="h-4 w-4" />
            Profile
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-background border-b">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
