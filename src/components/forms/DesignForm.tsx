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

const creativeFormats = [
  "Static Banners",
  "Carousel Ads",
  "Video Ads",
  "Social Media Posts",
  "Story / Reels",
  "Landing Page Design",
  "Email Template",
  "Logo / Branding",
];

const designStyles = ["Minimalist", "Bold & Colorful", "Corporate / Professional", "Playful / Fun", "Luxury / Premium", "Modern / Trendy"];

const suggestedSkills = [
  "Figma", "Adobe Photoshop", "Illustrator", "After Effects",
  "UI/UX", "Motion Graphics", "Brand Identity", "Typography",
];

interface Props {
  onBack: () => void;
}

export default function DesignForm({ onBack }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [designStyle, setDesignStyle] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [brandGuidelines, setBrandGuidelines] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const toggleFormat = (format: string) => {
    setSelectedFormats(selectedFormats.includes(format) ? selectedFormats.filter((f) => f !== format) : [...selectedFormats, format]);
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
      selectedFormats.length > 0 ? `\n\n**Creative Formats:** ${selectedFormats.join(", ")}` : "",
      designStyle ? `\n**Design Style:** ${designStyle}` : "",
      dimensions ? `\n**Dimensions/Sizes:** ${dimensions}` : "",
      brandGuidelines ? `\n**Brand Guidelines:** ${brandGuidelines}` : "",
      deliverables ? `\n**Deliverables:** ${deliverables}` : "",
    ].join("");

    const { error } = await supabase.from("projects").insert({
      client_id: user.id,
      title,
      description: fullDescription,
      service_type: "design" as const,
      budget: parseFloat(budget),
      deadline: deadline ? new Date(deadline).toISOString() : null,
      required_skills: skills,
      status: "open",
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Design project created!");
      navigate("/dashboard/projects");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to project type
      </button>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Design & Visualization Project</h1>
        <p className="text-muted-foreground text-sm">Hire a designer for ad creatives, banners, and visual assets.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input id="title" placeholder="e.g. Instagram Ad Creatives for Fashion Brand" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Project Brief</Label>
              <Textarea id="description" placeholder="Describe what you need designed, the purpose, your brand, target audience, and any references or inspiration..." value={description} onChange={(e) => setDescription(e.target.value)} rows={5} required maxLength={2000} />
            </div>

            <div className="space-y-2">
              <Label>Creative Formats Needed</Label>
              <div className="grid grid-cols-2 gap-2">
                {creativeFormats.map((format) => (
                  <label key={format} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={selectedFormats.includes(format)} onCheckedChange={() => toggleFormat(format)} />
                    {format}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Design Style</Label>
                <Select value={designStyle} onValueChange={setDesignStyle}>
                  <SelectTrigger><SelectValue placeholder="Select a style" /></SelectTrigger>
                  <SelectContent>
                    {designStyles.map((style) => (
                      <SelectItem key={style} value={style}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions / Sizes</Label>
                <Input id="dimensions" placeholder="e.g. 1080x1080, 1200x628" value={dimensions} onChange={(e) => setDimensions(e.target.value)} maxLength={200} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand Guidelines</Label>
              <Textarea id="brand" placeholder="Describe your brand colors, fonts, tone, and any existing assets or guidelines..." value={brandGuidelines} onChange={(e) => setBrandGuidelines(e.target.value)} rows={3} maxLength={1000} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverables">Deliverables</Label>
              <Textarea id="deliverables" placeholder="e.g. 5 static banners in PNG + PSD, 2 animated GIFs, source files..." value={deliverables} onChange={(e) => setDeliverables(e.target.value)} rows={2} maxLength={500} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (USD)</Label>
                <Input id="budget" type="number" min="1" step="1" placeholder="300" value={budget} onChange={(e) => setBudget(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline (optional)</Label>
                <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} min={new Date().toISOString().split("T")[0]} />
              </div>
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
                {loading ? "Creating..." : "Create Design Project"}
              </Button>
              <Button type="button" variant="outline" onClick={onBack}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
