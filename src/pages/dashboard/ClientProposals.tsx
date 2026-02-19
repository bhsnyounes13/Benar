import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check, X, Clock, DollarSign } from "lucide-react";

export default function ClientProposals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: proposals, isLoading } = useQuery({
    queryKey: ["client-incoming-proposals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*, projects!inner(client_id, title)")
        .eq("projects.client_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch freelancer profiles separately
      const freelancerIds = [...new Set(data.map((p) => p.freelancer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, skills")
        .in("user_id", freelancerIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      return data.map((p) => ({ ...p, freelancer: profileMap.get(p.freelancer_id) || null }));
    },
    enabled: !!user,
  });

  const updateProposal = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "rejected" }) => {
      const { error } = await supabase.from("proposals").update({ status }).eq("id", id);
      if (error) throw error;

      // If accepted, create a contract
      if (status === "accepted") {
        const proposal = proposals?.find((p: any) => p.id === id);
        if (proposal) {
          const { error: contractError } = await supabase.from("contracts").insert({
            project_id: proposal.project_id,
            client_id: user!.id,
            freelancer_id: proposal.freelancer_id,
            proposal_id: id,
            amount: proposal.price,
            platform_fee: Number(proposal.price) * 0.1,
          });
          if (contractError) throw contractError;

          // Update project status
          await supabase.from("projects").update({ status: "in_progress" }).eq("id", proposal.project_id);
        }
      }
    },
    onSuccess: (_, { status }) => {
      toast.success(`Proposal ${status}!`);
      queryClient.invalidateQueries({ queryKey: ["client-incoming-proposals"] });
      queryClient.invalidateQueries({ queryKey: ["client-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["client-projects"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const statusColors: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    accepted: "bg-success/10 text-success",
    rejected: "bg-destructive/10 text-destructive",
    withdrawn: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Incoming Proposals</h1>
        <p className="text-muted-foreground text-sm">Review proposals from freelancers on your projects.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}</div>
      ) : proposals && proposals.length > 0 ? (
        <div className="space-y-4">
          {proposals.map((proposal: any) => (
            <Card key={proposal.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-semibold text-base">{proposal.projects?.title}</h3>
                      <Badge variant="secondary" className={statusColors[proposal.status] || ""}>
                        {proposal.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      From: {proposal.freelancer?.full_name || "Unknown Freelancer"}
                    </p>
                    {proposal.message && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{proposal.message}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />${Number(proposal.price).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{proposal.delivery_days} days delivery
                      </span>
                    </div>
                    {proposal.freelancer?.skills && proposal.freelancer.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {proposal.freelancer.skills.slice(0, 5).map((skill: string) => (
                          <span key={skill} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {proposal.status === "pending" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        className="bg-success text-success-foreground hover:bg-success/90"
                        onClick={() => updateProposal.mutate({ id: proposal.id, status: "accepted" })}
                        disabled={updateProposal.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => updateProposal.mutate({ id: proposal.id, status: "rejected" })}
                        disabled={updateProposal.isPending}
                      >
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No proposals received yet. Create a project to start receiving proposals.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
