import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Star, CheckCircle, UserPlus } from "lucide-react";

export default function HireFreelancers() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Fetch all freelancer profiles (designers & media buyers)
  const { data: freelancers, isLoading } = useQuery({
    queryKey: ["hire-freelancers"],
    queryFn: async () => {
      // Get user IDs that have freelancer roles
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["designer", "media_buyer"]);
      if (roleError) throw roleError;

      const freelancerIds = [...new Set(roleData.map((r) => r.user_id))];
      if (freelancerIds.length === 0) return [];

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", freelancerIds)
        .eq("is_suspended", false);
      if (error) throw error;

      // Fetch roles for each freelancer
      const { data: allRoles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", freelancerIds);

      // Fetch avg ratings
      const { data: reviews } = await supabase
        .from("reviews")
        .select("target_id, rating")
        .in("target_id", freelancerIds);

      const rolesMap: Record<string, string[]> = {};
      allRoles?.forEach((r) => {
        if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
        rolesMap[r.user_id].push(r.role);
      });

      const ratingsMap: Record<string, { sum: number; count: number }> = {};
      reviews?.forEach((r) => {
        if (!ratingsMap[r.target_id]) ratingsMap[r.target_id] = { sum: 0, count: 0 };
        ratingsMap[r.target_id].sum += r.rating;
        ratingsMap[r.target_id].count += 1;
      });

      return profiles.map((p) => ({
        ...p,
        roles: rolesMap[p.user_id] || [],
        avgRating: ratingsMap[p.user_id]
          ? (ratingsMap[p.user_id].sum / ratingsMap[p.user_id].count).toFixed(1)
          : null,
        reviewCount: ratingsMap[p.user_id]?.count || 0,
      }));
    },
  });

  const filtered = freelancers?.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.full_name.toLowerCase().includes(q) ||
      f.bio?.toLowerCase().includes(q) ||
      f.skills?.some((s: string) => s.toLowerCase().includes(q)) ||
      f.platforms?.some((p: string) => p.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Hire Freelancers</h1>
        <p className="text-muted-foreground text-sm">Browse talented designers and media buyers.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, skill, or platform..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-56 rounded-lg" />
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((freelancer) => {
            const initials = (freelancer.full_name || "U")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <Card key={freelancer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4 mb-3">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={freelancer.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-display font-semibold text-base truncate">
                          {freelancer.full_name}
                        </h3>
                        {freelancer.is_verified && (
                          <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {freelancer.roles
                          .filter((r: string) => r !== "client" && r !== "admin")
                          .map((role: string) => (
                            <Badge key={role} variant="secondary" className="text-[10px] capitalize">
                              {role.replace("_", " ")}
                            </Badge>
                          ))}
                        {freelancer.is_featured && (
                          <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-200">
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {freelancer.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {freelancer.bio}
                    </p>
                  )}

                  {freelancer.avgRating && (
                    <div className="flex items-center gap-1 text-sm mb-3">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{freelancer.avgRating}</span>
                      <span className="text-muted-foreground text-xs">
                        ({freelancer.reviewCount} review{freelancer.reviewCount !== 1 ? "s" : ""})
                      </span>
                    </div>
                  )}

                  {freelancer.skills && freelancer.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {freelancer.skills.slice(0, 5).map((skill: string) => (
                        <span
                          key={skill}
                          className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent"
                        >
                          {skill}
                        </span>
                      ))}
                      {freelancer.skills.length > 5 && (
                        <span className="text-xs text-muted-foreground">
                          +{freelancer.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  )}

                  {freelancer.platforms && freelancer.platforms.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {freelancer.platforms.map((platform: string) => (
                        <Badge key={platform} variant="outline" className="text-[10px]">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Button
                    size="sm"
                    className="w-full mt-3 bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() => navigate("/dashboard/projects/new")}
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" /> Hire
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No freelancers found. Try a different search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
