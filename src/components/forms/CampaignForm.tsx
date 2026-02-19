import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, X, Plus } from "lucide-react";

const campaignGoals = [
  "Brand Awareness",
  "Lead Generation",
  "Sales / Conversions",
  "App Installs",
  "Website Traffic",
  "Engagement",
];

const adPlatforms = ["Meta Ads", "Google Ads", "TikTok Ads", "LinkedIn Ads", "Twitter/X Ads", "Snapchat Ads"];

const suggestedSkills = [
  "A/B Testing", "Analytics", "Retargeting", "Copywriting",
  "Audience Research", "CRO", "Email Marketing", "Funnel Building",
];

interface Props {
  onBack: () => void;
}

export default function CampaignForm({ onBack }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [monthlyAdBudget, setMonthlyAdBudget] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const toggleItem = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) setSkills([...skills, trimmed]);
    setSkillInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (title.length > 200 || description.length > 2000) {
      toast.error("Title or description is too long.");
      return;
    }

    setLoading(true);
    const fullDescription = [
      description,
      selectedGoals.length > 0 ? `\n\n**Campaign Goals:** ${selectedGoals.join(", ")}` : "",
      selectedPlatforms.length > 0 ? `\n**Platforms:** ${selectedPlatforms.join(", ")}` : "",
      targetAudience ? `\n**Target Audience:** ${targetAudience}` : "",
      monthlyAdBudget ? `\n**Monthly Ad Budget:** $${monthlyAdBudget}` : "",
    ].join("");

    const { error } = await supabase.from("projects").insert({
      client_id: user.id,
      title,
      description: fullDescription,
      service_type: "campaign" as const,
      budget: parseFloat(budget),
      deadline: deadline ? new Date(deadline).toISOString() : null,
      required_skills: [...skills, ...selectedPlatforms.filter((p) => !skills.includes(p))],
      status: "open",
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Campaign project created!");
      navigate("/dashboard/projects");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to project type
      </button>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Ad Campaign Project</h1>
        <p className="text-muted-foreground text-sm">Find a media buyer to manage your advertising campaigns.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input id="title" placeholder="e.g. Facebook Lead Gen Campaign for SaaS Product" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Campaign Brief</Label>
              <Textarea id="description" placeholder="Describe your product/service, campaign objectives, current situation, and what you expect from the media buyer..." value={description} onChange={(e) => setDescription(e.target.value)} rows={5} required maxLength={2000} />
            </div>

            <div className="space-y-2">
              <Label>Campaign Goals</Label>
              <div className="flex flex-wrap gap-2">
                {campaignGoals.map((goal) => (
                  <button key={goal} type="button" onClick={() => toggleItem(goal, selectedGoals, setSelectedGoals)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedGoals.includes(goal) ? "bg-accent text-accent-foreground border-accent" : "border-border text-muted-foreground hover:border-accent"}`}>
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Advertising Platforms</Label>
              <div className="grid grid-cols-2 gap-2">
                {adPlatforms.map((platform) => (
                  <label key={platform} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={selectedPlatforms.includes(platform)} onCheckedChange={() => toggleItem(platform, selectedPlatforms, setSelectedPlatforms)} />
                    {platform}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Textarea id="audience" placeholder="Describe your ideal customer: age, location, interests, behaviors..." value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} rows={3} maxLength={1000} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adBudget">Monthly Ad Spend (USD)</Label>
                <Input id="adBudget" type="number" min="1" step="1" placeholder="5000" value={monthlyAdBudget} onChange={(e) => setMonthlyAdBudget(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Freelancer Budget (USD)</Label>
                <Input id="budget" type="number" min="1" step="1" placeholder="500" value={budget} onChange={(e) => setBudget(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (optional)</Label>
              <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>

            <div className="space-y-2">
              <Label>Required Skills</Label>
              <div className="flex gap-2">
                <Input placeholder="Add a skill..." value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }} />
                <Button type="button" variant="outline" size="icon" onClick={() => addSkill(skillInput)}><Plus className="h-4 w-4" /></Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1">{skill}<button type="button" onClick={() => setSkills(skills.filter((s) => s !== skill))}><X className="h-3 w-3" /></button></Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {suggestedSkills.filter((s) => !skills.includes(s)).slice(0, 6).map((skill) => (
                  <button key={skill} type="button" onClick={() => addSkill(skill)} className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors">+ {skill}</button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90 flex-1" disabled={loading}>
                {loading ? "Creating..." : "Create Campaign Project"}
              </Button>
              <Button type="button" variant="outline" onClick={onBack}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
