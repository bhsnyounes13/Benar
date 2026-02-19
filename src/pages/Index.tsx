import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Palette,
  BarChart3,
  Shield,
  ArrowRight,
  Star,
  Users,
  Briefcase,
  CheckCircle2,
  Megaphone,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { useState, forwardRef } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="font-display text-xl font-bold text-primary">
          Ad<span className="text-accent">Connect</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#roles" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            For You
          </a>
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Log In
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              Get Started
            </Button>
          </Link>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t bg-background p-4 flex flex-col gap-3">
          <a href="#features" className="text-sm py-2" onClick={() => setOpen(false)}>
            Features
          </a>
          <a href="#how-it-works" className="text-sm py-2" onClick={() => setOpen(false)}>
            How It Works
          </a>
          <a href="#roles" className="text-sm py-2" onClick={() => setOpen(false)}>
            For You
          </a>
          <Link to="/login" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full">
              Log In
            </Button>
          </Link>
          <Link to="/register" onClick={() => setOpen(false)}>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Get Started</Button>
          </Link>
        </div>
      )}
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="container max-w-5xl text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
            The #1 Digital Advertising Marketplace
          </span>
        </motion.div>
        <motion.h1
          className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-primary mb-6 leading-tight"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
        >
          Connect with Top
          <br />
          <span className="text-accent">Ad Creatives</span> & <span className="text-accent">Media Buyers</span>
        </motion.h1>
        <motion.p
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
        >
          Find expert graphic designers and media buyers for your digital ad campaigns. From creative design to campaign
          management — all in one platform.
        </motion.p>
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
        >
          <Link to="/register">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8 h-12">
              Start Hiring <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/register">
            <Button size="lg" variant="outline" className="text-base px-8 h-12">
              Join as Freelancer
            </Button>
          </Link>
        </motion.div>
        <motion.div
          className="mt-14 flex flex-wrap justify-center gap-8 text-muted-foreground"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={4}
        >
          {[
            { icon: Users, label: "500+ Freelancers" },
            { icon: Briefcase, label: "1,200+ Projects" },
            { icon: Star, label: "4.9 Avg Rating" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-sm">
              <s.icon className="h-4 w-4 text-accent" />
              <span>{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Palette,
    title: "Ad Creative Design",
    description: "Find talented designers who craft scroll-stopping ads for Meta, Google, TikTok and more.",
  },
  {
    icon: Megaphone,
    title: "Campaign Management",
    description: "Hire expert media buyers to launch, optimize, and scale your ad campaigns across platforms.",
  },
  {
    icon: Shield,
    title: "Secure Escrow Payments",
    description: "Funds are held safely in escrow and released only when you approve the delivered work.",
  },
  {
    icon: BarChart3,
    title: "Performance Tracking",
    description: "Track real campaign metrics — CPC, CTR, ROAS — with transparent performance reports.",
  },
  {
    icon: Zap,
    title: "Real-time Collaboration",
    description: "Chat in real time, share files, and iterate quickly with built-in messaging per project.",
  },
  {
    icon: CheckCircle2,
    title: "Verified Reviews",
    description: "Make confident hiring decisions with authentic ratings and reviews from past clients.",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-secondary/50">
      <div className="container">
        <motion.div
          className="text-center mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">Everything You Need</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A complete platform purpose-built for digital advertising freelancing.
          </p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <Card className="h-full hover:shadow-lg transition-shadow border-border/60">
                <CardContent className="p-6">
                  <div className="h-11 w-11 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    step: "01",
    title: "Post a Project",
    description: "Describe your ad needs, set a budget, and publish your project in minutes.",
  },
  {
    step: "02",
    title: "Get Proposals",
    description: "Receive tailored proposals from vetted designers and media buyers.",
  },
  {
    step: "03",
    title: "Collaborate & Deliver",
    description: "Work together in real time, track progress, and approve deliverables.",
  },
  {
    step: "04",
    title: "Pay Securely",
    description: "Release payment from escrow once you're satisfied with the results.",
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="container max-w-4xl">
        <motion.div
          className="text-center mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From posting a project to getting results — in four simple steps.
          </p>
        </motion.div>
        <div className="grid sm:grid-cols-2 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              className="flex gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-display font-bold text-sm">
                {s.step}
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg mb-1">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const roles = [
  {
    title: "For Clients",
    description: "Post your ad project, review proposals, and hire the perfect creative professional.",
    items: [
      "Post unlimited projects",
      "Review portfolios & ratings",
      "Secure escrow payments",
      "Track project progress",
    ],
  },
  {
    title: "For Designers",
    description: "Showcase your portfolio, bid on ad design projects, and grow your freelance career.",
    items: ["Build your portfolio", "Set your own rates", "Get paid securely", "Earn verified reviews"],
  },
  {
    title: "For Media Buyers",
    description: "Find campaign management gigs, demonstrate your ROAS, and build your reputation.",
    items: ["Showcase campaign results", "Report real metrics", "Manage multiple clients", "Grow your brand"],
  },
];

function RolesSection() {
  return (
    <section id="roles" className="py-20 bg-secondary/50">
      <div className="container">
        <motion.div
          className="text-center mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">Built For Everyone</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Whether you're hiring or freelancing, AdConnect has you covered.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((r, i) => (
            <motion.div
              key={r.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-display font-bold text-xl mb-2 text-accent">{r.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{r.description}</p>
                  <ul className="space-y-2">
                    {r.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const CTASection = forwardRef<HTMLElement>(function CTASection(_, ref) {
  return (
    <section ref={ref} className="py-20">
      <div className="container max-w-3xl text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            Ready to Grow Your Business?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join thousands of clients and freelancers already using AdConnect to power their digital advertising.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-10 h-12">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
});

const Footer = forwardRef<HTMLElement>(function Footer(_, ref) {
  return (
    <footer ref={ref} className="border-t py-10">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-display font-bold text-primary">
          Ad<span className="text-accent">Connect</span>
        </span>
        <p className="text-sm text-muted-foreground">© 2026 AdConnect. All rights reserved.</p>
      </div>
    </footer>
  );
});

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <RolesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
