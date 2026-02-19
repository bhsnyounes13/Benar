import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, FileText, Handshake, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function ClientOverview() {
  const { user } = useAuth();

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ["client-projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: proposals, isLoading: loadingProposals } = useQuery({
    queryKey: ["client-proposals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*, projects!inner(client_id, title)")
        .eq("projects.client_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: contracts, isLoading: loadingContracts } = useQuery({
    queryKey: ["client-contracts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*, projects(title)")
        .eq("client_id", user!.id)
        .in("status", ["in_progress", "under_review"])
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const stats = [
    {
      label: "Active Projects",
      value: projects?.filter((p) => ["open", "in_progress"].includes(p.status)).length ?? 0,
      icon: FolderOpen,
      color: "text-accent",
    },
    {
      label: "Pending Proposals",
      value: proposals?.length ?? 0,
      icon: FileText,
      color: "text-warning",
    },
    {
      label: "Active Contracts",
      value: contracts?.length ?? 0,
      icon: Handshake,
      color: "text-success",
    },
    {
      label: "Total Spent",
      value: `$${contracts?.reduce((sum, c) => sum + Number(c.amount), 0).toLocaleString() ?? 0}`,
      icon: DollarSign,
      color: "text-accent",
    },
  ];

  const statusColors: Record<string, string> = {
    open: "bg-accent/10 text-accent",
    draft: "bg-muted text-muted-foreground",
    in_progress: "bg-warning/10 text-warning",
    under_review: "bg-accent/10 text-accent",
    completed: "bg-success/10 text-success",
    cancelled: "bg-destructive/10 text-destructive",
  };

  const isLoading = loadingProjects || loadingProposals || loadingContracts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {user?.user_metadata?.full_name || "Client"}</p>
        </div>
        <Link to="/dashboard/projects/new">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">New Project</Button>
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
        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-display text-lg">Recent Projects</CardTitle>
            <Link to="/dashboard/projects" className="text-xs text-accent hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {loadingProjects ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : projects && projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{project.title}</p>
                      <p className="text-xs text-muted-foreground">${Number(project.budget).toLocaleString()} · {format(new Date(project.created_at), "MMM d")}</p>
                    </div>
                    <Badge variant="secondary" className={statusColors[project.status] || ""}>
                      {project.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">No projects yet. Create your first one!</p>
            )}
          </CardContent>
        </Card>

        {/* Pending Proposals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-display text-lg">Pending Proposals</CardTitle>
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
                    <Badge variant="secondary" className="bg-warning/10 text-warning">Pending</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">No pending proposals.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Contracts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-display text-lg">Active Contracts</CardTitle>
          <Link to="/dashboard/contracts" className="text-xs text-accent hover:underline">View all</Link>
        </CardHeader>
        <CardContent>
          {loadingContracts ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : contracts && contracts.length > 0 ? (
            <div className="space-y-3">
              {contracts.map((contract: any) => (
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
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
