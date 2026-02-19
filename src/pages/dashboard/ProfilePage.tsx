import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Camera, Save, X, Plus, Star, Shield, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  skills: z.array(z.string().max(50)).max(20, "Max 20 skills"),
  platforms: z.array(z.string().max(50)).max(10, "Max 10 platforms"),
});

export default function ProfilePage() {
  const { user, roles } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newPlatform, setNewPlatform] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch reviews targeting this user
  const { data: reviews = [] } = useQuery({
    queryKey: ["profile-reviews", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("target_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get reviewer names
  const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))];
  const { data: reviewerProfiles = [] } = useQuery({
    queryKey: ["reviewer-profiles", reviewerIds.join(",")],
    queryFn: async () => {
      if (reviewerIds.length === 0) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name").in("user_id", reviewerIds);
      return data || [];
    },
    enabled: reviewerIds.length > 0,
  });
  const reviewerMap = Object.fromEntries(reviewerProfiles.map((p) => [p.user_id, p.full_name]));

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const startEditing = () => {
    if (profile) {
      setFullName(profile.full_name || "");
      setBio(profile.bio || "");
      setSkills(profile.skills || []);
      setPlatforms(profile.platforms || []);
    }
    setEditing(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !profile) throw new Error("Not authenticated");
      const parsed = profileSchema.parse({ full_name: fullName, bio, skills, platforms });
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: parsed.full_name,
          bio: parsed.bio || "",
          skills: parsed.skills,
          platforms: parsed.platforms,
        })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (err) => {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      } else {
        toast.error("Failed to update profile");
      }
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: `${urlData.publicUrl}?t=${Date.now()}` })
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      toast.success("Avatar updated");
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 20) {
      setSkills([...skills, trimmed]);
      setNewSkill("");
    }
  };

  const addPlatform = () => {
    const trimmed = newPlatform.trim();
    if (trimmed && !platforms.includes(trimmed) && platforms.length < 10) {
      setPlatforms([...platforms, trimmed]);
      setNewPlatform("");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12 text-muted-foreground">Loading profile...</div>;
  }

  const initials = (profile?.full_name || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-2xl font-bold">{profile?.full_name || "Unnamed"}</h1>
                {profile?.is_verified && <CheckCircle className="h-5 w-5 text-primary" />}
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                {roles.map((role) => (
                  <Badge key={role} variant="secondary" className="capitalize">
                    {role.replace("_", " ")}
                  </Badge>
                ))}
                {profile?.is_featured && <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Featured</Badge>}
              </div>
              {avgRating && (
                <div className="flex items-center gap-1 justify-center sm:justify-start text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{avgRating}</span>
                  <span>({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
                </div>
              )}
            </div>

            {/* Edit button */}
            <div>
              {!editing ? (
                <Button onClick={startEditing} variant="outline" size="sm">Edit Profile</Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={() => saveMutation.mutate()} size="sm" disabled={saveMutation.isPending}>
                    <Save className="h-3.5 w-3.5 mr-1" /> Save
                  </Button>
                  <Button onClick={() => setEditing(false)} variant="ghost" size="sm">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio & Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} className="mt-1" />
            </div>
          ) : null}

          {editing ? (
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Tell others about yourself..."
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">{bio.length}/500</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{profile?.bio || "No bio yet."}</p>
          )}

          <Separator />

          {/* Skills */}
          <div>
            <Label className="text-sm font-medium">Skills</Label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(editing ? skills : profile?.skills || []).map((skill, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {skill}
                  {editing && (
                    <button onClick={() => setSkills(skills.filter((_, j) => j !== i))} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {!editing && (!profile?.skills || profile.skills.length === 0) && (
                <span className="text-sm text-muted-foreground">No skills added</span>
              )}
            </div>
            {editing && (
              <div className="flex gap-2 mt-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="Add a skill"
                  maxLength={50}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={addSkill} type="button">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Platforms */}
          <div>
            <Label className="text-sm font-medium">Platforms</Label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(editing ? platforms : profile?.platforms || []).map((platform, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {platform}
                  {editing && (
                    <button onClick={() => setPlatforms(platforms.filter((_, j) => j !== i))} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {!editing && (!profile?.platforms || profile.platforms.length === 0) && (
                <span className="text-sm text-muted-foreground">No platforms added</span>
              )}
            </div>
            {editing && (
              <div className="flex gap-2 mt-2">
                <Input
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPlatform())}
                  placeholder="e.g. Facebook Ads, TikTok"
                  maxLength={50}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={addPlatform} type="button">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    by {reviewerMap[review.reviewer_id] || "Anonymous"}
                  </span>
                </div>
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
