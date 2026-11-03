import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeaderAuthButton } from "@/components/layout/HeaderAuthButton";
import { Footer } from "@/components/layout/Footer";
import { Logo } from "@/components/ui/logo";
import { TextLoop } from "@/components/ui/TextLoop";
import { SplitText } from "@/components/ui/SplitText";
import ScrollStack, { ScrollStackItem } from "@/components/ui/ScrollStack";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Coffee,
  Compass,
  Cookie,
  Mic,
  PenLine,
  Shield,
  ShieldCheck,
  Smile,
  Sparkles,
  Sprout,
  Timer,
  Volume2,
  Zap,
} from "lucide-react";

export default function HomePage() {
  const phases = [
    {
      number: 1,
      badge: "Week 1",
      days: "Days 1–7",
      title: "Build the habit & baseline",
      focus: "Establish your daily 30-min groove and record baseline speaking and writing samples.",
      badgeColor: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
      cardBg: "bg-gradient-to-br from-card via-card to-amber-500/10",
      borderColor: "border-amber-300/80 dark:border-amber-900/60",
      accentColor: "text-amber-600 dark:text-amber-400",
      pillBg: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
      glow: "shadow-amber-500/5",
    },
    {
      number: 2,
      badge: "Week 2",
      days: "Days 8–14",
      title: "Opinions & comparisons",
      focus: "Express nuanced viewpoints, weigh pros & cons, and practice comparative linkers.",
      badgeColor: "bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
      cardBg: "bg-gradient-to-br from-card via-card to-sky-500/10",
      borderColor: "border-sky-300/80 dark:border-sky-900/60",
      accentColor: "text-sky-600 dark:text-sky-400",
      pillBg: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
      glow: "shadow-sky-500/5",
    },
    {
      number: 3,
      badge: "Week 3",
      days: "Days 15–21",
      title: "Develop and support ideas",
      focus: "Build extended paragraphs using examples, cause-and-effect, and problem-solution frames.",
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
      cardBg: "bg-gradient-to-br from-card via-card to-emerald-500/10",
      borderColor: "border-emerald-300/80 dark:border-emerald-900/60",
      accentColor: "text-emerald-600 dark:text-emerald-400",
      pillBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      glow: "shadow-emerald-500/5",
    },
    {
      number: 4,
      badge: "Week 4",
      days: "Days 22–28",
      title: "Abstract topics & precision",
      focus: "Navigate ethical dilemmas, modal verbs of deduction, and active vs. passive nuance.",
      badgeColor: "bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
      cardBg: "bg-gradient-to-br from-card via-card to-purple-500/10",
      borderColor: "border-purple-300/80 dark:border-purple-900/60",
      accentColor: "text-purple-600 dark:text-purple-400",
      pillBg: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
      glow: "shadow-purple-500/5",
    },
    {
      number: 5,
      badge: "Week 5",
      days: "Days 29–35",
      title: "B2-style extended discourse",
      focus: "Multi-paragraph flow, nominalization, diplomatic balance, and unscripted confidence.",
      badgeColor: "bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800",
      cardBg: "bg-gradient-to-br from-card via-card to-orange-500/10",
      borderColor: "border-orange-300/80 dark:border-orange-900/60",
      accentColor: "text-orange-600 dark:text-orange-400",
      pillBg: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
      glow: "shadow-orange-500/5",
    },
    {
      number: 6,
      badge: "Week 6",
      days: "Days 36–41",
      title: "Timed practice & grand finale",
      focus: "Simulated exam timing, error self-correction, and the Day 1 vs. Day 41 growth audit.",
      badgeColor: "bg-rose-100 text-rose-900 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
      cardBg: "bg-gradient-to-br from-card via-card to-rose-500/10",
      borderColor: "border-rose-300/80 dark:border-rose-900/60",
      accentColor: "text-rose-600 dark:text-rose-400",
      pillBg: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
      glow: "shadow-rose-500/5",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navigation */}
      <header className="border-b border-border/80 bg-background/90 backdrop-blur-md sticky top-0 z-40 transition-all duration-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group pressable">
            <Logo className="h-9 md:h-10 w-auto text-foreground group-hover:text-primary transition-colors" />
            <div className="flex flex-col">
              <span className="font-bold text-sm sm:text-base tracking-tight flex items-center gap-1.5">
                41-Day Upgrade
                <span className="inline-block size-1.5 rounded-full bg-primary animate-pulse" />
              </span>
              <span className="text-[10px] text-muted-foreground font-mono font-medium">
                B1 → B2 Daily Studio
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Badge variant="cute" className="hidden sm:inline-flex items-center gap-1.5 text-[11px] animate-scale-in">
              <Calendar className="size-3 text-primary shrink-0" />
              <span>31 Oct – 10 Dec 2026</span>
            </Badge>
            <HeaderAuthButton variant="sm" />
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-16 md:space-y-24">
        {/* Hero Section */}
        <section className="pt-12 md:pt-20 px-4 max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary text-secondary-foreground border border-border/80 text-xs font-semibold shadow-2xs animate-fade-up">
            <Cookie className="size-4 text-primary shrink-0" />
            <span>Your 30-minute daily English bite</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-primary font-bold">41 Days</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl mx-auto leading-[1.12]">
            <span className="animate-fade-up stagger-1 inline-block">
              Speak naturally. <br className="hidden sm:inline" />
              Write fearlessly. <br className="hidden sm:inline" />
            </span>
            <span className="relative inline-block text-primary">
              <SplitText
                tag="span"
                text="Grow every single day."
                effect="flip"
                splitType="chars"
                delay={50}
                duration={1.25}
                trigger="view"
                hoverEffect="lift"
              />
              <svg
                aria-hidden="true"
                className="absolute left-0 -bottom-2 md:-bottom-2.5 w-full h-2 md:h-2.5 text-primary/40 pointer-events-none overflow-visible"
              >
                <defs>
                  <pattern
                    id="hero-wavy-underline"
                    width="16"
                    height="10"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 0 5 Q 4 1, 8 5 T 16 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hero-wavy-underline)" />
              </svg>
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-up stagger-2">
            No endless grammar drills. Just 15 minutes of unscripted voice practice and
            15 minutes of non-translator writing in a calm, beautiful personal studio.
          </p>

          <div className="pt-2 flex flex-wrap justify-center items-center gap-3 animate-fade-up stagger-3">
            <HeaderAuthButton variant="lg" className="shadow-sm pressable" />
            <Button asChild variant="outline" size="lg" className="rounded-2xl pressable">
              <a href="#routine">
                <Compass className="size-4 mr-2 text-primary" />
                See the 30-Min Flow
              </a>
            </Button>
          </div>

          {/* Showcase Preview Card with gentle float */}
          <div className="pt-8 max-w-3xl mx-auto animate-fade-up stagger-4">
            <Card className="border-2 border-border/80 shadow-md bg-card/90 overflow-hidden text-left card-hover-lift animate-float">
              <div className="bg-secondary/60 px-5 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-rose-400" />
                  <span className="size-3 rounded-full bg-amber-400" />
                  <span className="size-3 rounded-full bg-emerald-400" />
                  <span className="text-xs font-mono font-medium text-muted-foreground ml-2">
                    Today&apos;s 30-Minute Workspace
                  </span>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  Day 1 • Baseline
                </Badge>
              </div>

              <div className="p-5 md:p-6 grid sm:grid-cols-2 gap-4">
                {/* Speaking Bite */}
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 space-y-2.5 transition-all duration-200 hover:border-blue-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                      <Mic className="size-4" /> 15m Voice Studio
                    </span>
                    <Badge variant="speaking" className="text-[10px] py-0">
                      Audio Recording
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    &quot;Introduce yourself and explain your current English goal.&quot;
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Speak continuously without reading from a script. Review your recording afterward.
                  </p>
                  <div className="pt-1 flex items-center gap-2 text-[10px] font-mono text-blue-600 dark:text-blue-400">
                    <span className="inline-block size-2 rounded-full bg-red-500 animate-pulse" />
                    <span>In-browser recorder ready</span>
                  </div>
                </div>

                {/* Writing Bite */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 space-y-2.5 transition-all duration-200 hover:border-emerald-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <PenLine className="size-4" /> 15m Writing Studio
                    </span>
                    <Badge variant="writing" className="text-[10px] py-0 font-mono">
                      Target: 120 words
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    &quot;Write a 120-word self-introduction for networking.&quot;
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Draft directly in English without a translator. Auto-save preserves your drafts.
                  </p>
                  <div className="pt-1 flex items-center gap-2 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    <span>Real-time word counter</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Full Edge-to-Edge Curved Ribbon Banner */}
        <section className="w-full overflow-hidden py-2 my-1">
          <TextLoop
            fullBleed
            text="Speak Naturally ✦ Write Fearlessly ✦ 41-Day English Upgrade ✦ B1 to B2 Mastery"
            shape="wave"
            speed={50}
            curviness={24}
            fontSize={32}
            fontWeight={800}
            ribbon={true}
            ribbonColor="#d97706"
            ribbonWidth={60}
            pauseOnHover={false}
            edgeFade={0}
          />
        </section>

        {/* 30-Min Daily Routine Breakdown */}
        <section id="routine" className="py-16 bg-muted/40 border-y border-border/80 px-4">
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <Badge variant="cute" className="animate-scale-in inline-flex items-center gap-1.5">
                <Timer className="size-3.5 text-primary shrink-0" />
                <span>Timeboxed & Low Stress</span>
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                The Daily 30-Minute Rhythm
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Split evenly between your ears, voice, mind, and pen.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Speaking Card */}
              <Card className="border-2 border-blue-200/80 dark:border-blue-900/60 shadow-xs card-hover-lift">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <Mic className="size-4" /> Part 1: Voice & Expression
                    </span>
                    <Badge variant="speaking" className="font-mono text-xs">
                      15 Minutes
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">Unscripted Speaking</CardTitle>
                  <CardDescription>
                    Train spontaneous thought retrieval instead of silent perfectionism.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3.5 text-xs">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-card border transition-all duration-200 hover:border-blue-300">
                    <Badge variant="secondary" className="font-mono text-[10px] shrink-0 mt-0.5">
                      0–2 min
                    </Badge>
                    <div>
                      <strong className="text-foreground">Prompt & Keywords:</strong> Pick 3–5 anchor words. Never write a full script.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-card border transition-all duration-200 hover:border-blue-300">
                    <Badge variant="secondary" className="font-mono text-[10px] shrink-0 mt-0.5">
                      2–12 min
                    </Badge>
                    <div>
                      <strong className="text-foreground">Record Aloud:</strong> Speak directly into the browser recorder. Embrace pauses and recover with composure.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-card border transition-all duration-200 hover:border-blue-300">
                    <Badge variant="secondary" className="font-mono text-[10px] shrink-0 mt-0.5">
                      12–15 min
                    </Badge>
                    <div>
                      <strong className="text-foreground">Listen Back:</strong> Audit a short snippet. Note one strong sentence and one hesitation point.
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Writing Card */}
              <Card className="border-2 border-emerald-200/80 dark:border-emerald-900/60 shadow-xs card-hover-lift">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <PenLine className="size-4" /> Part 2: Pen & Structure
                    </span>
                    <Badge variant="writing" className="font-mono text-xs">
                      15 Minutes
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">Translator-Free Writing</CardTitle>
                  <CardDescription>
                    Construct cohesive paragraphs using your active vocabulary first.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3.5 text-xs">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-card border transition-all duration-200 hover:border-emerald-300">
                    <Badge variant="secondary" className="font-mono text-[10px] shrink-0 mt-0.5">
                      15–17 min
                    </Badge>
                    <div>
                      <strong className="text-foreground">Quick Outline:</strong> Define your core answer and two supporting reasons.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-card border transition-all duration-200 hover:border-emerald-300">
                    <Badge variant="secondary" className="font-mono text-[10px] shrink-0 mt-0.5">
                      17–27 min
                    </Badge>
                    <div>
                      <strong className="text-foreground">Draft Freely:</strong> Write directly in English without tab-switching to translators or grammar bots.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-card border transition-all duration-200 hover:border-emerald-300">
                    <Badge variant="secondary" className="font-mono text-[10px] shrink-0 mt-0.5">
                      27–30 min
                    </Badge>
                    <div>
                      <strong className="text-foreground">Proofread Checklist:</strong> Review verb tenses, connector words, and the day&apos;s specific challenge.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* 6 Phases Stepping Stones with ScrollStack */}
        <section className="py-16 px-4 max-w-5xl mx-auto space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <Badge variant="cute" className="inline-flex items-center gap-1.5">
              <Compass className="size-3.5 text-primary shrink-0" />
              <span>The 6-Week Roadmap</span>
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              From B1 Baseline to B2 Polish
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Each phase introduces targeted linguistic skills without overwhelming you. Scroll down to unpack each week&apos;s milestone.
            </p>
          </div>

          <div className="max-w-2xl mx-auto w-full">
            <ScrollStack
              useWindowScroll={true}
              smoothScroll={true}
              stackPosition="120px"
              itemDistance={30}
              itemStackDistance={24}
              itemScale={0.04}
              baseScale={0.86}
              dimAmount={0.12}
              rotationAmount={1}
              holdDistance={130}
            >
              {phases.map((phase) => (
                <ScrollStackItem
                  key={phase.number}
                  itemClassName={`flex flex-col justify-between p-5 sm:p-6 min-h-[13.5rem] sm:min-h-[14.5rem] !h-auto border shadow-xl ${phase.cardBg} ${phase.borderColor} ${phase.glow} transition-colors`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`flex size-6 items-center justify-center rounded-full font-mono text-xs font-bold ${phase.pillBg}`}>
                          {phase.number}
                        </span>
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${phase.badgeColor}`}>
                          {phase.badge}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-medium text-muted-foreground bg-muted/80 px-2.5 py-0.5 rounded-md border border-border/40">
                        {phase.days}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                        {phase.title}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {phase.focus}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <CheckCircle2 className={`size-4 ${phase.accentColor}`} /> Phase {phase.number} Milestone
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground/80">
                      Step {phase.number} of 6
                    </span>
                  </div>
                </ScrollStackItem>
              ))}
            </ScrollStack>

            {/* Bouncy Expand CTA Button to Login */}
            <div className="pt-10 sm:pt-14 pb-2 flex flex-col items-center justify-center text-center space-y-3">
              <Link
                href="/login"
                className="group btn-bouncy-expand relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-base sm:text-lg shadow-lg shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 cursor-pointer"
              >
                <span>Start Your 41-Day Journey</span>
                <span className="flex size-7 items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-1.5 group-hover:scale-110">
                  <ArrowRight className="size-4" />
                </span>
              </Link>
              <p className="text-xs text-muted-foreground font-medium">
                Ready to upgrade your speaking and writing?{" "}
                <Link href="/login" className="text-primary hover:underline font-semibold">
                  Log in to get started &rarr;
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Three Thoughtful Guarantees */}
        <section className="py-12 bg-secondary/40 border-t border-border/80 px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <h3 className="text-xl font-bold text-center tracking-tight">
              Designed for Consistency, Not Overwhelm
            </h3>

            <div className="grid sm:grid-cols-3 gap-6 text-center sm:text-left">
              <div className="bg-card p-5 rounded-2xl border shadow-2xs space-y-3 card-hover-lift">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto sm:mx-0">
                  <Coffee className="size-5" />
                </div>
                <h4 className="font-bold text-sm">No Backlog Anxiety</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Missed yesterday? You never have to do double the work. The platform simply resumes from your lowest incomplete day.
                </p>
              </div>

              <div className="bg-card p-5 rounded-2xl border shadow-2xs space-y-3 card-hover-lift">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto sm:mx-0">
                  <Sprout className="size-5" />
                </div>
                <h4 className="font-bold text-sm">Mistakes Are Welcome</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  First drafts are for genuine thinking. Automatic translators rob you of neural retrieval. Draft raw first; refine second.
                </p>
              </div>

              <div className="bg-card p-5 rounded-2xl border shadow-2xs space-y-3 card-hover-lift">
                <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 mx-auto sm:mx-0">
                  <ShieldCheck className="size-5" />
                </div>
                <h4 className="font-bold text-sm">Private & Protected</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No public feeds, no vanity leaderboards. All your voice recordings and essays are securely encrypted and private to you.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
