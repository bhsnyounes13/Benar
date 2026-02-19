import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Wallet as WalletIcon, TrendingUp, ArrowDownToLine, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const withdrawalStatusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
  processed: "bg-accent/10 text-accent",
};

export default function WalletPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: wallet, isLoading: loadingWallet } = useQuery({
    queryKey: ["wallet", user?.id],
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

  const { data: withdrawals, isLoading: loadingWithdrawals } = useQuery({
    queryKey: ["withdrawals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: recentPayments, isLoading: loadingPayments } = useQuery({
    queryKey: ["freelancer-payments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, amount, platform_fee, status, projects(title), start_date")
        .eq("freelancer_id", user!.id)
        .eq("status", "completed")
        .order("updated_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Wallet</h1>
          <p className="text-muted-foreground text-sm">Manage your earnings and withdrawals.</p>
        </div>
        {wallet && Number(wallet.balance) > 0 && (
          <WithdrawDialog wallet={wallet} userId={user!.id} onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
            queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
          }} />
        )}
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loadingWallet ? (
          [1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)
        ) : (
          <>
            <Card className="border-accent/20">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <WalletIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Available Balance</p>
                  <p className="text-3xl font-bold font-display">${Number(wallet?.balance ?? 0).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                  <p className="text-3xl font-bold font-display">${Number(wallet?.total_earned ?? 0).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
                  <ArrowDownToLine className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending Withdrawals</p>
                  <p className="text-3xl font-bold font-display">
                    ${(withdrawals?.filter(w => w.status === "pending").reduce((s, w) => s + Number(w.amount), 0) ?? 0).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Completed Jobs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Completed Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPayments ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : recentPayments && recentPayments.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.projects?.title || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">Earned: ${(Number(p.amount) - Number(p.platform_fee)).toLocaleString()}</p>
                    </div>
                    <Badge variant="secondary" className="bg-success/10 text-success">Completed</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">No completed jobs yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingWithdrawals ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : withdrawals && withdrawals.length > 0 ? (
              <div className="space-y-3">
                {withdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">${Number(w.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(w.created_at), "MMM d, yyyy")}</p>
                    </div>
                    <Badge variant="secondary" className={withdrawalStatusColors[w.status] || ""}>{w.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">No withdrawals yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function WithdrawDialog({ wallet, userId, onSuccess }: { wallet: any; userId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (numAmount <= 0 || numAmount > Number(wallet.balance)) {
      toast.error("Invalid withdrawal amount.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("withdrawals").insert({
      user_id: userId,
      wallet_id: wallet.id,
      amount: numAmount,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Withdrawal request submitted!");
      setOpen(false);
      setAmount("");
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
          <ArrowDownToLine className="h-4 w-4 mr-2" /> Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Request Withdrawal</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Available: <span className="font-medium text-foreground">${Number(wallet.balance).toLocaleString()}</span></p>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max={wallet.balance}
              step="0.01"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
            {loading ? "Submitting..." : "Request Withdrawal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
