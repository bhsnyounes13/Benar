import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Handshake, Wallet, Search, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  accepted: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
  in_progress: "bg-warning/10 text-warning",
  under_review: "bg-accent/10 text-accent",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function FreelancerOverview() {
  const { user } = useAuth();

  const { data: proposals, isLoading: loadingProposals } = useQuery({
    queryKey: ["freelancer-proposals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*, projects(title)")
        .eq("freelancer_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: contracts, isLoading: loadingContracts } = useQuery({
    queryKey: ["freelancer-contracts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*, projects(title)")
        .eq("freelancer_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: wallet, isLoading: loadingWallet } = useQuery({
    queryKey: ["freelancer-wallet", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const activeContracts = contracts?.filter((c) => ["in_progress", "under_review"].includes(c.status)) || [];
  const pendingProposals = proposals?.filter((p) => p.status === "pending") || [];
  const totalEarned = wallet?.total_earned ?? 0;
  const balance = wallet?.balance ?? 0;

  const stats = [
    { label: "Pending Proposals", value: pendingProposals.length, icon: FileText, color: "text-warning" },
    { label: "Active Contracts", value: activeContracts.length, icon: Handshake, color: "text-accent" },
    { label: "Available Balance", value: `$${Number(balance).toLocaleString()}`, icon: Wallet, color: "text-success" },
    { label: "Total Earned", value: `$${Number(totalEarned).toLocaleString()}`, icon: TrendingUp, color: "text-accent" },
  ];

  const isLoading = loadingProposals || loadingContracts || loadingWallet;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {user?.user_metadata?.full_name || "Freelancer"}</p>
        </div>
        <Link to="/dashboard/browse">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Search className="h-4 w-4 mr-2" /> Browse Projects
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-4">
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <div className={cn("h-10 w-10 rounded-lg bg-secondary flex items-center justify-center", stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold font-display">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Proposals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-display text-lg">My Proposals</CardTitle>
            <Link to="/dashboard/proposals" className="text-xs text-accent hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {loadingProposals ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : proposals && proposals.length > 0 ? (
              <div className="space-y-3">
                {proposals.map((proposal: any) => (
                  <div key={proposal.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{proposal.projects?.title}</p>
                      <p className="text-xs text-muted-foreground">${Number(proposal.price).toLocaleString()} · {proposal.delivery_days} days</p>
                    </div>
                    <Badge variant="secondary" className={statusColors[proposal.status] || ""}>{proposal.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">No proposals yet. Browse projects to get started!</p>
            )}
          </CardContent>
        </Card>

        {/* Active Contracts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-display text-lg">Active Contracts</CardTitle>
            <Link to="/dashboard/contracts" className="text-xs text-accent hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {loadingContracts ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : activeContracts.length > 0 ? (
              <div className="space-y-3">
                {activeContracts.map((contract: any) => (
                  <div key={contract.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{contract.projects?.title || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">${Number(contract.amount).toLocaleString()} · Started {format(new Date(contract.start_date), "MMM d")}</p>
                    </div>
                    <Badge variant="secondary" className={statusColors[contract.status] || ""}>
                      {contract.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">No active contracts.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
