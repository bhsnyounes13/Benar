import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Clock, DollarSign, XCircle } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  accepted: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
};

export default function FreelancerProposals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: proposals, isLoading } = useQuery({
    queryKey: ["freelancer-all-proposals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*, projects(title, budget, service_type, status)")
        .eq("freelancer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const withdrawProposal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("proposals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Proposal withdrawn.");
      queryClient.invalidateQueries({ queryKey: ["freelancer-all-proposals"] });
      queryClient.invalidateQueries({ queryKey: ["my-proposal-project-ids"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">My Proposals</h1>
        <p className="text-muted-foreground text-sm">{proposals?.length ?? 0} proposals submitted</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
      ) : proposals && proposals.length > 0 ? (
        <div className="space-y-4">
          {proposals.map((proposal: any) => (
            <Card key={proposal.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-semibold text-base truncate">{proposal.projects?.title}</h3>
                      <Badge variant="secondary" className={statusColors[proposal.status] || ""}>{proposal.status}</Badge>
                    </div>
                    {proposal.message && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{proposal.message}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />Your bid: ${Number(proposal.price).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{proposal.delivery_days} days
                      </span>
                      <span>Budget: ${Number(proposal.projects?.budget || 0).toLocaleString()}</span>
                      <span>{format(new Date(proposal.created_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  {proposal.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                      onClick={() => withdrawProposal.mutate(proposal.id)}
                      disabled={withdrawProposal.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Withdraw
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No proposals yet. Browse projects to find your next gig!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
