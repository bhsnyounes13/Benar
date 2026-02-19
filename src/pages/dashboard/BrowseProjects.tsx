import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Calendar, DollarSign, Send } from "lucide-react";
import { format } from "date-fns";

const serviceTypeLabels: Record<string, string> = {
  design: "Ad Creative Design",
  campaign: "Campaign Management",
  full_package: "Full Package",
};

function SubmitProposalDialog({ project, userId, onSuccess }: { project: any; userId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("7");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("proposals").insert({
      project_id: project.id,
      freelancer_id: userId,
      price: parseFloat(price),
      delivery_days: parseInt(deliveryDays),
      message,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Proposal submitted!");
      setOpen(false);
      setPrice("");
      setDeliveryDays("7");
      setMessage("");
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Send className="h-3.5 w-3.5 mr-1" /> Apply
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Submit Proposal</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-2">For: <span className="font-medium text-foreground">{project.title}</span></p>
        <p className="text-xs text-muted-foreground mb-4">Budget: ${Number(project.budget).toLocaleString()}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Your Price (USD)</Label>
              <Input id="price" type="number" min="1" step="1" placeholder="400" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="days">Delivery (days)</Label>
              <Input id="days" type="number" min="1" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Cover Letter</Label>
            <Textarea id="message" placeholder="Explain why you're the best fit for this project..." rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={loading}>
            {loading ? "Submitting..." : "Submit Proposal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function BrowseProjects() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("all");

  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ["browse-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Check which projects the user already submitted proposals for
  const { data: myProposalProjectIds } = useQuery({
    queryKey: ["my-proposal-project-ids", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("project_id")
        .eq("freelancer_id", user!.id);
      if (error) throw error;
      return new Set(data.map((p) => p.project_id));
    },
    enabled: !!user,
  });

  const filtered = projects?.filter((p) => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchService = serviceFilter === "all" || p.service_type === serviceFilter;
    // Exclude own projects
    const notOwn = p.client_id !== user?.id;
    return matchSearch && matchService && notOwn;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Browse Projects</h1>
        <p className="text-muted-foreground text-sm">Find open projects and submit proposals.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="design">Ad Creative Design</SelectItem>
            <SelectItem value="campaign">Campaign Management</SelectItem>
            <SelectItem value="full_package">Full Package</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects list */}
      {isLoading ? (
        <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}</div>
      ) : filtered && filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((project) => {
            const alreadyApplied = myProposalProjectIds?.has(project.id);
            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-display font-semibold text-base">{project.title}</h3>
                        <Badge variant="outline" className="text-xs">{serviceTypeLabels[project.service_type] || project.service_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <DollarSign className="h-3 w-3" />${Number(project.budget).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{format(new Date(project.created_at), "MMM d, yyyy")}
                        </span>
                        {project.deadline && (
                          <span className="text-warning">Due: {format(new Date(project.deadline), "MMM d")}</span>
                        )}
                      </div>
                      {project.required_skills && project.required_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.required_skills.map((skill: string) => (
                            <span key={skill} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">{skill}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {alreadyApplied ? (
                        <Badge variant="secondary" className="bg-success/10 text-success">Applied</Badge>
                      ) : (
                        <SubmitProposalDialog project={project} userId={user!.id} onSuccess={() => refetch()} />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No open projects found. Check back soon!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
