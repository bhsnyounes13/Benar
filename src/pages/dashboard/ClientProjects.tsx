import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Plus, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  open: "bg-accent/10 text-accent",
  draft: "bg-muted text-muted-foreground",
  in_progress: "bg-warning/10 text-warning",
  under_review: "bg-accent/10 text-accent",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function ClientProjects() {
  const { user } = useAuth();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["client-all-projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">My Projects</h1>
          <p className="text-muted-foreground text-sm">{projects?.length ?? 0} projects total</p>
        </div>
        <Link to="/dashboard/projects/new">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" /> New Project
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}</div>
      ) : projects && projects.length > 0 ? (
        <div className="space-y-4">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-semibold text-base truncate">{project.title}</h3>
                      <Badge variant="secondary" className={statusColors[project.status] || ""}>
                        {project.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{project.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />${Number(project.budget).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{format(new Date(project.created_at), "MMM d, yyyy")}
                      </span>
                      <Badge variant="outline" className="text-xs">{project.service_type.replace("_", " ")}</Badge>
                    </div>
                    {project.required_skills && project.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.required_skills.map((skill: string) => (
                          <span key={skill} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">You haven't created any projects yet.</p>
            <Link to="/dashboard/projects/new">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Create Your First Project</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
