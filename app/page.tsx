import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeaderAuthButton } from "@/components/layout/HeaderAuthButton";
import { ArrowRight, CheckCircle, Clock, Mic, PenLine, Shield, Sparkles } from "lucide-react";

export default function HomePage() {
  const phases = [
    {
      week: "Week 1",
      days: "Days 1–7",
      title: "Build the habit & baseline",
      focus: "Establish daily 30-min routine and record baseline speaking/writing samples.",
    },
    {
      week: "Week 2",
      days: "Days 8–14",
      title: "Opinions & comparisons",
      focus: "Express nuanced viewpoints, balance trade-offs, and use comparative linkers.",
    },
    {
      week: "Week 3",
      days: "Days 15–21",
      title: "Develop and support ideas",
      focus: "Exemplification, problem-solution frameworks, and cohesive paragraph extension.",
    },
    {
      week: "Week 4",
      days: "Days 22–28",
      title: "Abstract topics & precision",
      focus: "Nuanced ethics, passive voice control, modal deduction, and conceptual depth.",
    },
    {
      week: "Week 5",
      days: "Days 29–35",
      title: "B2-style extended responses",
      focus: "Multi-paragraph discourse markers, nominalization, and spontaneous fluency.",
    },
    {
      week: "Week 6",
      days: "Days 36–41",
      title: "Timed practice & refinement",
      focus: "Simulated exam timing, error self-correction, and final Day 1 vs 41 comparison.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navigation */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              41
            </div>
            <span className="font-semibold text-lg tracking-tight">
              English Upgrade
            </span>
            <Badge variant="outline" className="ml-2 text-xs">
              B1 → B2
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <HeaderAuthButton variant="sm" />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/60 text-xs font-medium text-muted-foreground mb-6">
            <Sparkles className="size-3.5 text-primary" />
            41-Day Intensive Productive Skills Challenge • 31 Oct – 10 Dec 2026
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
            Build confident, accurate, and extended English responses.
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A dedicated, distraction-free web studio designed for daily 30-minute practice:
            15 minutes of structured Speaking followed by 15 minutes of non-translator Writing.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <HeaderAuthButton variant="lg" />
            <Button asChild variant="outline" size="lg">
              <a href="#routine">Explore 30-Min Routine</a>
            </Button>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 text-left">
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-foreground">41 Days</div>
                <p className="text-xs text-muted-foreground mt-1">Structured curriculum sequence</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-foreground">15 + 15 min</div>
                <p className="text-xs text-muted-foreground mt-1">Daily Speaking & Writing</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-foreground">B1 → B2</div>
                <p className="text-xs text-muted-foreground mt-1">Target productive CEFR level</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-foreground">100% Private</div>
                <p className="text-xs text-muted-foreground mt-1">Encrypted personal recordings & drafts</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 30-Min Daily Routine Breakdown */}
        <section id="routine" className="py-16 bg-muted/40 border-y px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                The 30-Minute Daily Routine
              </h2>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">
                Scientifically calibrated timeboxing to foster habit formation and uninhibited productive fluency.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Speaking Routine */}
              <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                    <Mic className="size-4" /> 15-Minute Speaking Session
                  </div>
                  <CardTitle className="text-xl">Unscripted Spoken Flow</CardTitle>
                  <CardDescription>
                    Overcome hesitation through real audio recording and self-listening.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary" className="shrink-0 font-mono text-xs">0–2 min</Badge>
                    <div>
                      <strong>Prompt & Keywords:</strong> Read the day&apos;s prompt and identify 3–5 anchor keywords. Do not script.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary" className="shrink-0 font-mono text-xs">2–12 min</Badge>
                    <div>
                      <strong>Record Speaking:</strong> Speak continuously into the browser recorder. Practice self-recovery over perfection.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary" className="shrink-0 font-mono text-xs">12–15 min</Badge>
                    <div>
                      <strong>Self-Auditing:</strong> Listen back to a short segment; note one vocal strength and one hesitation point.
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Writing Routine */}
              <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                    <PenLine className="size-4" /> 15-Minute Writing Session
                  </div>
                  <CardTitle className="text-xl">Translator-Free Production</CardTitle>
                  <CardDescription>
                    Develop coherent written sentences using your active vocabulary first.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary" className="shrink-0 font-mono text-xs">15–17 min</Badge>
                    <div>
                      <strong>Mental Outline:</strong> Formulate a central thesis statement and two clear supporting pillars.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary" className="shrink-0 font-mono text-xs">17–27 min</Badge>
                    <div>
                      <strong>Active Drafting:</strong> Write without switching to translation or grammar assistants. Target 120–200 words.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary" className="shrink-0 font-mono text-xs">27–30 min</Badge>
                    <div>
                      <strong>Proofreading Checklist:</strong> Verify verb tenses, paragraph cohesion, and the day&apos;s specific grammar action.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* 6 Phases Curriculum Overview */}
        <section className="py-16 md:py-24 px-4 max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Six Progressive Learning Phases
            </h2>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              A carefully sequenced progression moving from habit foundation to advanced B2 argumentation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {phases.map((phase) => (
              <Card key={phase.week} className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-1">
                    <span>{phase.week}</span>
                    <Badge variant="outline">{phase.days}</Badge>
                  </div>
                  <CardTitle className="text-lg">{phase.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{phase.focus}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pedagogical Rules & Guarantees */}
        <section className="py-16 bg-muted/20 border-t px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl font-bold mb-6 text-center">Core Platform Principles</h3>
            <div className="grid sm:grid-cols-3 gap-6 text-sm">
              <div className="flex flex-col items-center text-center p-4">
                <Shield className="size-8 text-primary mb-3" />
                <h4 className="font-semibold mb-1">Zero Backlog Fatigue</h4>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Missing a calendar day never doubles your workload. You always resume from the lowest incomplete numbered day.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <Clock className="size-8 text-primary mb-3" />
                <h4 className="font-semibold mb-1">Preserved History</h4>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Submitting a revision preserves previous attempts so you can track your tangible evolution from Day 1 to Day 41.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <CheckCircle className="size-8 text-primary mb-3" />
                <h4 className="font-semibold mb-1">Meaningful Self-Reflection</h4>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Weekly review milestones evaluate genuine confidence, discourse cohesion, and communicative effectiveness.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-4 text-center text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 41-Day English Upgrade. Taffan M portfolio project.</p>
          <p>Target CEFR Level: B2 • Self-assessment & practice platform.</p>
        </div>
      </footer>
    </div>
  );
}
