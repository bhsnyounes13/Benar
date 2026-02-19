import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import CampaignForm from "@/components/forms/CampaignForm";
import DesignForm from "@/components/forms/DesignForm";

type ProjectType = "campaign" | "design" | null;

export default function CreateProject() {
  const [projectType, setProjectType] = useState<ProjectType>(null);

  if (projectType === "campaign") {
    return <CampaignForm onBack={() => setProjectType(null)} />;
  }

  if (projectType === "design") {
    return <DesignForm onBack={() => setProjectType(null)} />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Create New Project</h1>
        <p className="text-muted-foreground text-sm">
          Choose the type of project you need help with.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <button onClick={() => setProjectType("campaign")} className="text-left">
          <Card className={cn("h-full transition-all hover:shadow-md hover:border-accent cursor-pointer")}>
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Megaphone className="h-7 w-7 text-accent" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg mb-1">Ad Campaign</h3>
                <p className="text-sm text-muted-foreground">
                  Find a media buyer to manage your advertising campaigns across platforms like Meta, Google, and TikTok.
                </p>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 w-full text-left">
                <li>• Target audience & demographics</li>
                <li>• Platform selection & budget</li>
                <li>• Campaign goals & KPIs</li>
              </ul>
            </CardContent>
          </Card>
        </button>

        <button onClick={() => setProjectType("design")} className="text-left">
          <Card className={cn("h-full transition-all hover:shadow-md hover:border-accent cursor-pointer")}>
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Palette className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg mb-1">Design & Visualization</h3>
                <p className="text-sm text-muted-foreground">
                  Hire a designer for ad creatives, banners, social media visuals, and brand assets.
                </p>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 w-full text-left">
                <li>• Creative format & dimensions</li>
                <li>• Brand guidelines & style</li>
                <li>• Deliverable specifications</li>
              </ul>
            </CardContent>
          </Card>
        </button>
      </div>
    </div>
  );
}
