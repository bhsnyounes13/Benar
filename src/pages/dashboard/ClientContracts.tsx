import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, DollarSign, User, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  in_progress: "bg-warning/10 text-warning",
  submitted: "bg-accent/10 text-accent",
  needs_revision: "bg-destructive/10 text-destructive",
  approved: "bg-success/10 text-success",
  under_review: "bg-accent/10 text-accent",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function ClientContracts() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: contracts, isLoading } = useQuery({
    queryKey: ["client-all-contracts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*, projects(title)")
        .eq("client_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch freelancer profiles
      const freelancerIds = [...new Set(data.map((c) => c.freelancer_id))];
      if (freelancerIds.length === 0) return data.map((c) => ({ ...c, freelancer: null }));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", freelancerIds);
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      return data.map((c) => ({ ...c, freelancer: profileMap.get(c.freelancer_id) || null }));
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">My Contracts</h1>
        <p className="text-muted-foreground text-sm">{contracts?.length ?? 0} contracts total</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
      ) : contracts && contracts.length > 0 ? (
        <div className="space-y-4">
          {contracts.map((contract: any) => (
            <Card key={contract.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/dashboard/contracts/${contract.id}`)}>
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-semibold text-base truncate">
                        {contract.projects?.title || "Untitled Project"}
                      </h3>
                      <Badge variant="secondary" className={statusColors[contract.status] || ""}>
                        {contract.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />{contract.freelancer?.full_name || "Unknown"}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />${Number(contract.amount).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{format(new Date(contract.start_date), "MMM d, yyyy")}
                      </span>
                      {contract.deadline && (
                        <span className="text-warning">Due: {format(new Date(contract.deadline), "MMM d, yyyy")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Platform fee</p>
                      <p className="text-sm font-medium">${Number(contract.platform_fee).toLocaleString()}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No contracts yet. Accept a proposal to create your first contract.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
