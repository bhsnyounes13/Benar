import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, RotateCcw, Send, DollarSign, Calendar, User, Clock, AlertCircle, Lock,
} from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  in_progress: { label: "In Progress", color: "bg-warning/10 text-warning border-warning/30", icon: <Clock className="h-4 w-4" /> },
  submitted: { label: "Submitted", color: "bg-accent/10 text-accent border-accent/30", icon: <Send className="h-4 w-4" /> },
  needs_revision: { label: "Needs Revision", color: "bg-destructive/10 text-destructive border-destructive/30", icon: <RotateCcw className="h-4 w-4" /> },
  approved: { label: "Approved", color: "bg-success/10 text-success border-success/30", icon: <CheckCircle2 className="h-4 w-4" /> },
  under_review: { label: "Under Review", color: "bg-accent/10 text-accent border-accent/30", icon: <Clock className="h-4 w-4" /> },
  completed: { label: "Completed", color: "bg-success/10 text-success border-success/30", icon: <CheckCircle2 className="h-4 w-4" /> },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive border-destructive/30", icon: <AlertCircle className="h-4 w-4" /> },
};

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submissionNote, setSubmissionNote] = useState("");
  const [revisionNote, setRevisionNote] = useState("");

  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*, projects(title, description, service_type, budget)")
        .eq("id", id!)
        .single();
      if (error) throw error;

      // Fetch both party profiles
      const [clientRes, freelancerRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").eq("user_id", data.client_id).single(),
        supabase.from("profiles").select("user_id, full_name").eq("user_id", data.freelancer_id).single(),
      ]);

      return {
        ...data,
        client_name: clientRes.data?.full_name || "Unknown",
        freelancer_name: freelancerRes.data?.full_name || "Unknown",
      };
    },
    enabled: !!id && !!user,
  });

  const isClient = contract?.client_id === user?.id;
  const isFreelancer = contract?.freelancer_id === user?.id;
  const earnings = contract ? Number(contract.amount) - Number(contract.platform_fee) : 0;

  // Submit work (freelancer)
  const submitWorkMutation = useMutation({
    mutationFn: async () => {
      // Send a message with the submission note
      if (submissionNote.trim()) {
        await supabase.from("messages").insert({
          contract_id: id!,
          sender_id: user!.id,
          content: `📋 Work Submitted:\n${submissionNote}`,
        });
      }
      const { error } = await supabase
        .from("contracts")
        .update({ status: "submitted" as any })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Work submitted for review!");
      setSubmissionNote("");
      queryClient.invalidateQueries({ queryKey: ["contract-detail", id] });
    },
    onError: () => toast.error("Failed to submit work"),
  });

  // Approve work (client)
  const approveWorkMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("contracts")
        .update({ status: "approved" as any, approved_at: new Date().toISOString() } as any)
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Work approved! You can now release payment.");
      queryClient.invalidateQueries({ queryKey: ["contract-detail", id] });
    },
    onError: () => toast.error("Failed to approve work"),
  });

  // Request revision (client)
  const requestRevisionMutation = useMutation({
    mutationFn: async () => {
      if (revisionNote.trim()) {
        await supabase.from("messages").insert({
          contract_id: id!,
          sender_id: user!.id,
          content: `🔄 Revision Requested:\n${revisionNote}`,
        });
      }
      const { error } = await supabase
        .from("contracts")
        .update({
          status: "needs_revision" as any,
          revision_count: (contract?.revision_count ?? 0) + 1,
        } as any)
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Revision requested.");
      setRevisionNote("");
      queryClient.invalidateQueries({ queryKey: ["contract-detail", id] });
    },
    onError: () => toast.error("Failed to request revision"),
  });

  // Release payment (client) — status must be approved
  const releasePaymentMutation = useMutation({
    mutationFn: async () => {
      if (!contract) throw new Error("No contract");
      const commissionRate = 0.10;
      const commission = Number(contract.amount) * commissionRate;
      const freelancerEarnings = Number(contract.amount) - commission;

      // Create payment record
      const { error: paymentError } = await supabase.from("payments").insert({
        contract_id: id!,
        payer_id: user!.id,
        amount: Number(contract.amount),
        platform_fee: commission,
        status: "released",
      });
      if (paymentError) throw paymentError;

      // Update contract to completed
      const { error: contractError } = await supabase
        .from("contracts")
        .update({ status: "completed" })
        .eq("id", id!);
      if (contractError) throw contractError;

      // Update project status to completed
      const { error: projectError } = await supabase
        .from("projects")
        .update({ status: "completed" })
        .eq("id", contract.project_id);
      if (projectError) throw projectError;

      // Credit freelancer wallet via secure server function
      const { error: walletError } = await supabase.rpc("credit_freelancer_wallet", {
        _freelancer_id: contract.freelancer_id,
        _amount: freelancerEarnings,
      });
      if (walletError) throw walletError;

      // Notify freelancer
      await supabase.from("notifications").insert({
        user_id: contract.freelancer_id,
        type: "payment_released",
        title: "Payment Released!",
        message: `$${freelancerEarnings.toLocaleString()} has been added to your wallet.`,
        reference_id: id,
      });
    },
    onSuccess: () => {
      toast.success("Payment released! Freelancer has been paid.");
      queryClient.invalidateQueries({ queryKey: ["contract-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err: any) => toast.error(err.message || "Payment failed"),
  });

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!contract) {
    return <p className="text-muted-foreground">Contract not found.</p>;
  }

  const status = statusConfig[contract.status] || statusConfig.in_progress;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-bold truncate">
            {contract.projects?.title || "Untitled Project"}
          </h1>
          <p className="text-sm text-muted-foreground">Contract Details</p>
        </div>
        <Badge variant="outline" className={`${status.color} gap-1.5 px-3 py-1`}>
          {status.icon} {status.label}
        </Badge>
      </div>

      {/* Contract Info */}
      <Card>
        <CardContent className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Client</p>
            <p className="text-sm font-medium flex items-center gap-1"><User className="h-3.5 w-3.5" />{contract.client_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Freelancer</p>
            <p className="text-sm font-medium flex items-center gap-1"><User className="h-3.5 w-3.5" />{contract.freelancer_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Amount</p>
            <p className="text-sm font-medium flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />${Number(contract.amount).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Start Date</p>
            <p className="text-sm font-medium flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{format(new Date(contract.start_date), "MMM d, yyyy")}</p>
          </div>
          {contract.deadline && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Deadline</p>
              <p className="text-sm font-medium text-warning">{format(new Date(contract.deadline), "MMM d, yyyy")}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Platform Fee (10%)</p>
            <p className="text-sm font-medium">${Number(contract.platform_fee).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Freelancer Earnings</p>
            <p className="text-sm font-medium text-success">${earnings.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Revisions</p>
            <p className="text-sm font-medium">{contract.revision_count ?? 0}</p>
          </div>
        </CardContent>
      </Card>

      {/* Work Status Actions */}
      {contract.status !== "completed" && contract.status !== "cancelled" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display">Work Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Freelancer: Submit Work */}
            {isFreelancer && (contract.status === "in_progress" || contract.status === "needs_revision") && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {contract.status === "needs_revision"
                    ? "The client has requested revisions. Update your work and resubmit."
                    : "When your work is ready, submit it for client review."}
                </p>
                <Textarea
                  placeholder="Add notes about your submission (optional)..."
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={() => submitWorkMutation.mutate()}
                  disabled={submitWorkMutation.isPending}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {submitWorkMutation.isPending ? "Submitting..." : "Submit Work"}
                </Button>
              </div>
            )}

            {/* Freelancer: Waiting for review */}
            {isFreelancer && contract.status === "submitted" && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/5 border border-accent/20">
                <Clock className="h-5 w-5 text-accent" />
                <p className="text-sm">Your work has been submitted. Waiting for client review...</p>
              </div>
            )}

            {/* Freelancer: Approved, waiting for payment */}
            {isFreelancer && contract.status === "approved" && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-success/5 border border-success/20">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <p className="text-sm">Your work has been approved! Waiting for client to release payment.</p>
              </div>
            )}

            {/* Client: Review submitted work */}
            {isClient && contract.status === "submitted" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <Send className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium">Work has been submitted for your review</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Check the messages for submitted files and notes.</p>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Revision feedback (optional)..."
                      value={revisionNote}
                      onChange={(e) => setRevisionNote(e.target.value)}
                      rows={2}
                    />
                    <Button
                      variant="outline"
                      onClick={() => requestRevisionMutation.mutate()}
                      disabled={requestRevisionMutation.isPending}
                      className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {requestRevisionMutation.isPending ? "Requesting..." : "Request Revision"}
                    </Button>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => approveWorkMutation.mutate()}
                      disabled={approveWorkMutation.isPending}
                      className="gap-2 bg-success text-success-foreground hover:bg-success/90"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {approveWorkMutation.isPending ? "Approving..." : "Approve Work"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Client: Needs revision — waiting for freelancer */}
            {isClient && contract.status === "needs_revision" && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-warning/5 border border-warning/20">
                <RotateCcw className="h-5 w-5 text-warning" />
                <p className="text-sm">Revision requested. Waiting for freelancer to resubmit.</p>
              </div>
            )}

            {/* Client: In progress — waiting */}
            {isClient && contract.status === "in_progress" && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Freelancer is working on the project...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Section */}
      {isClient && contract.status !== "completed" && contract.status !== "cancelled" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contract.status === "approved" ? (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                  <p className="text-sm font-medium">Work approved — ready to release payment</p>
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <p>Total: ${Number(contract.amount).toLocaleString()}</p>
                    <p>Platform Fee (10%): ${(Number(contract.amount) * 0.1).toLocaleString()}</p>
                    <p>Freelancer Receives: ${(Number(contract.amount) * 0.9).toLocaleString()}</p>
                  </div>
                </div>
                <Button
                  onClick={() => releasePaymentMutation.mutate()}
                  disabled={releasePaymentMutation.isPending}
                  className="w-full gap-2"
                  size="lg"
                >
                  <DollarSign className="h-4 w-4" />
                  {releasePaymentMutation.isPending ? "Processing..." : `Release Payment — $${Number(contract.amount).toLocaleString()}`}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Payment is locked until you approve the submitted work.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Completed state */}
      {contract.status === "completed" && (
        <Card className="border-success/30">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display font-semibold">Project Completed</p>
              <p className="text-sm text-muted-foreground">Payment has been released to the freelancer.</p>
              {contract.approved_at && (
                <p className="text-xs text-muted-foreground mt-1">Approved on {format(new Date(contract.approved_at), "MMM d, yyyy")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick link to messages */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => navigate(`/dashboard/messages?contract=${contract.id}`)}
      >
        Open Messages
      </Button>
    </div>
  );
}
