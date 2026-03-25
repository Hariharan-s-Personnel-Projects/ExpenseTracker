"use client";

import Link from "next/link";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bot,
  ChevronRight,
  Cpu,
  Fingerprint,
  PieChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Particle field component                                           */
/* ------------------------------------------------------------------ */
function ParticleField({ count = 40 }: { count?: number }) {
  const particles = useRef(
    Array.from({ length: count }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 6 + 4,
      delay: Math.random() * 4,
      opacity: Math.random() * 0.4 + 0.1,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated counter                                                   */
/* ------------------------------------------------------------------ */
function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
}: {
  target: number;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const startTime = performance.now();
          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Typing text effect                                                 */
/* ------------------------------------------------------------------ */
function TypingText({ texts }: { texts: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = texts[currentIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setDisplayedText(current.slice(0, displayedText.length + 1));
          if (displayedText.length + 1 === current.length) {
            setTimeout(() => setIsDeleting(true), 2000);
          }
        } else {
          setDisplayedText(current.slice(0, displayedText.length - 1));
          if (displayedText.length === 0) {
            setIsDeleting(false);
            setCurrentIndex((prev) => (prev + 1) % texts.length);
          }
        }
      },
      isDeleting ? 30 : 60
    );
    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentIndex, texts]);

  return (
    <span>
      {displayedText}
      <span className="inline-block w-[2px] h-[1em] bg-primary ml-0.5 align-text-bottom animate-pulse" />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Mouse-tracking glow                                                */
/* ------------------------------------------------------------------ */
function HeroGlow() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 50, damping: 20 });
  const springY = useSpring(y, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [x, y]);

  return (
    <motion.div
      className="fixed w-[500px] h-[500px] rounded-full pointer-events-none -z-5 blur-[150px] bg-primary/[0.07]"
      style={{
        left: useTransform(springX, (v) => v - 250),
        top: useTransform(springY, (v) => v - 250),
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Main landing page                                                  */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroGlow />

      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-4 sm:px-6 lg:px-8">
        {/* Perspective grid background */}
        <div className="absolute inset-0 futuristic-grid opacity-60" />

        {/* Scan line */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-scan-line" />
        </div>

        {/* Particle field */}
        <ParticleField count={30} />

        {/* Orbital rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none">
          <div className="absolute inset-0 rounded-full border border-primary/[0.06] animate-orbit">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/40" />
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none">
          <div className="absolute inset-0 rounded-full border border-primary/[0.04] animate-orbit-reverse">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-chart-2/40" />
          </div>
        </div>

        {/* Pulse rings from center */}
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full border border-primary/10 animate-pulse-ring pointer-events-none" />
        <div
          className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full border border-primary/10 animate-pulse-ring pointer-events-none"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full border border-primary/10 animate-pulse-ring pointer-events-none"
          style={{ animationDelay: "2s" }}
        />

        <div className="container mx-auto text-center max-w-5xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            {/* Badge with shimmer */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 text-sm font-medium relative overflow-hidden"
              animate={{ boxShadow: ["0 0 20px oklch(0.65 0.22 270 / 0)", "0 0 20px oklch(0.65 0.22 270 / 0.15)", "0 0 20px oklch(0.65 0.22 270 / 0)"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="h-4 w-4" />
              <span>Introducing Tracker AI 2.0</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer bg-[length:200%_100%]" />
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-primary/80">
              AI-Powered Personal <br className="hidden md:block" /> Finance
              Tracker
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-4 sm:mb-6 max-w-2xl mx-auto leading-relaxed">
              Track expenses, control your budget, and let intelligent AI manage
              your money. Built for speed, styled for the future.
            </p>

            {/* Typing text */}
            <div className="text-sm text-primary/70 mb-8 sm:mb-10 font-mono h-6">
              <TypingText
                texts={[
                  "Log my 200 rupee lunch...",
                  "How much did I spend this week?",
                  "Show my budget breakdown...",
                  "Set category limit for food...",
                ]}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all active:scale-95 glow-primary relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center">
                    Get Started <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-8 text-base border-border/50 bg-background/50 hover:bg-muted/50 backdrop-blur-sm transition-all active:scale-95"
                >
                  Live Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Animated Dashboard Preview Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-12 sm:mt-20 relative mx-auto max-w-5xl hidden sm:block"
          >
            {/* Glow behind mockup */}
            <div className="absolute -inset-4 bg-primary/[0.05] blur-[60px] rounded-3xl" />

            <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden relative gradient-border noise-overlay">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

              {/* Fake browser chrome */}
              <div className="h-12 border-b border-border/50 bg-muted/20 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-muted/30 rounded-md px-4 py-1 text-xs text-muted-foreground font-mono flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3 text-emerald-500/60" />
                    tracker-ai.app/dashboard
                  </div>
                </div>
              </div>

              <div className="aspect-[16/9] w-full bg-gradient-to-br from-muted/20 via-background to-muted/10 p-8 flex items-center justify-center relative overflow-hidden">
                {/* Data stream lines */}
                <div className="absolute right-[20%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/10 to-transparent animate-data-stream" />
                <div
                  className="absolute right-[40%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-chart-2/10 to-transparent animate-data-stream"
                  style={{ animationDelay: "0.7s", animationDuration: "2.5s" }}
                />
                <div
                  className="absolute left-[30%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-chart-3/10 to-transparent animate-data-stream"
                  style={{ animationDelay: "1.3s", animationDuration: "3s" }}
                />

                {/* Stats card - floating */}
                <motion.div
                  className="absolute top-8 left-8 w-64 h-32 rounded-xl border border-border/50 bg-background/50 backdrop-blur-md shadow-sm p-4 flex flex-col justify-center"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="text-xs text-muted-foreground mb-1 font-mono">MONTHLY BUDGET</div>
                  <div className="text-2xl font-bold gradient-text">₹24,500</div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-emerald-500">
                    <TrendingUp className="w-3 h-3" />
                    <span>12% under limit</span>
                  </div>
                </motion.div>

                {/* Chart card - floating */}
                <motion.div
                  className="absolute bottom-8 right-8 w-80 h-48 rounded-xl border border-border/50 bg-background/50 backdrop-blur-md shadow-sm p-4 flex items-end justify-between gap-2"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <div className="absolute top-3 left-4 text-xs text-muted-foreground font-mono">WEEKLY SPENDING</div>
                  {[45, 72, 38, 91, 55, 67, 80].map((height, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{
                        background: `linear-gradient(to top, oklch(0.65 0.22 270 / 0.5), oklch(0.6 0.16 290 / 0.3))`,
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                    />
                  ))}
                </motion.div>

                {/* Chat Mockup - floating */}
                <motion.div
                  className="absolute bottom-8 left-8 w-72 h-44 rounded-xl border border-border/50 bg-background/60 backdrop-blur-md shadow-sm p-4 flex flex-col justify-end space-y-3"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <div className="absolute top-3 left-4 flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <Bot className="w-3 h-3 text-primary" />
                    AI ASSISTANT
                  </div>
                  <div className="self-end bg-primary/20 p-2 rounded-lg text-xs w-3/4 border border-primary/10">
                    Log my 150 rupee lunch
                  </div>
                  <div className="self-start bg-muted/50 p-2 rounded-lg text-xs w-4/5 flex items-center gap-2 border border-border/30">
                    <Bot size={12} className="text-primary shrink-0" /> Logged! You have
                    ₹1,200 remaining this week.
                  </div>
                </motion.div>

                {/* Category indicator - top right */}
                <motion.div
                  className="absolute top-8 right-8 w-48 rounded-xl border border-border/50 bg-background/50 backdrop-blur-md shadow-sm p-4"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                >
                  <div className="text-xs text-muted-foreground font-mono mb-3">TOP CATEGORIES</div>
                  {[
                    { name: "Food", pct: 35, color: "bg-primary/60" },
                    { name: "Transport", pct: 22, color: "bg-chart-2/60" },
                    { name: "Shopping", pct: 18, color: "bg-chart-3/60" },
                  ].map((cat) => (
                    <div key={cat.name} className="mb-2 last:mb-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground/70">{cat.name}</span>
                        <span className="text-muted-foreground">{cat.pct}%</span>
                      </div>
                      <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${cat.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.pct}%` }}
                          transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. STATS BAR */}
      <section className="py-12 border-y border-border/30 relative">
        <div className="absolute inset-0 bg-muted/[0.02] pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 10000, suffix: "+", label: "Transactions Tracked", icon: Zap },
              { value: 500, suffix: "+", label: "Active Users", icon: Fingerprint },
              { value: 99, suffix: "%", label: "Uptime Guarantee", icon: Cpu },
              { value: 5, suffix: "s", prefix: "<", label: "AI Response Time", icon: Bot },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 mb-3 group-hover:bg-primary/20 group-hover:shadow-sm group-hover:shadow-primary/20 transition-all">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-bold gradient-text mb-1">
                  <AnimatedCounter
                    target={stat.value}
                    suffix={stat.suffix}
                    prefix={stat.prefix}
                  />
                </div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section className="py-24 relative">
        <div className="absolute inset-0 futuristic-grid opacity-30" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6 text-sm font-medium">
              <Cpu className="h-3.5 w-3.5" />
              <span>Core Systems</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything you need to master your money
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Purpose-built tools designed to give you clarity and control over
              your financial life.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "AI Expense Assistant",
                desc: "Automatically add expenses through natural chat. Just tell the AI what you spent.",
                icon: Bot,
              },
              {
                title: "Smart Budget Tracking",
                desc: "Monthly budgets with automatic weekly limits and real-time alerts.",
                icon: Wallet,
              },
              {
                title: "Spending Insights",
                desc: "Visual analytics, trend charts, and category breakdowns at a glance.",
                icon: PieChart,
              },
              {
                title: "Secure Data",
                desc: "Enterprise-grade Supabase auth with encrypted data at rest.",
                icon: ShieldCheck,
              },
            ].map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full bg-card/60 border-border/40 backdrop-blur-sm hover:bg-card/80 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.05] transition-all duration-300 group holographic">
                  <CardContent className="p-6 relative">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 group-hover:bg-primary/20 group-hover:shadow-sm group-hover:shadow-primary/20 transition-all">
                      <feat.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feat.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feat.desc}
                    </p>
                    <div className="flex items-center gap-1 mt-4 text-xs text-primary/60 group-hover:text-primary transition-colors">
                      <span>Learn more</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="py-24 border-y border-border/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/[0.02] pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              How it works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Three simple steps to financial clarity.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line with animated gradient */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 overflow-hidden -z-10">
              <div className="h-full w-full bg-gradient-to-r from-primary/20 via-chart-2/30 to-primary/20" />
              <motion.div
                className="absolute top-0 left-0 h-full w-[30%] bg-gradient-to-r from-transparent via-primary/60 to-transparent"
                animate={{ left: ["-30%", "130%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            {[
              {
                step: "01",
                title: "Set your budget",
                desc: "Establish your monthly allowance and let us calculate your optimal weekly limits.",
              },
              {
                step: "02",
                title: "Track daily",
                desc: "Log transactions manually or simply tell the AI what you bought.",
              },
              {
                step: "03",
                title: "Gain insights",
                desc: "Chat with the AI for immediate feedback on spending trends and safety margins.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="flex flex-col items-center text-center relative"
              >
                <div className="relative mb-6">
                  {/* Pulsing ring behind step number */}
                  <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse" />
                  <div className="w-16 h-16 rounded-full bg-card/80 border border-primary/20 flex items-center justify-center text-xl font-bold font-mono shadow-lg shadow-primary/[0.08] backdrop-blur-sm relative">
                    <span className="gradient-text">{item.step}</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. AI FEATURE SHOWCASE */}
      <section className="py-24 relative">
        <ParticleField count={15} />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-4 text-sm font-medium">
                <Bot className="h-4 w-4" />
                <span>Tool-calling AI</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                Your personal <br />{" "}
                <span className="gradient-text">financial analyst.</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mt-6">
                Don&apos;t just view charts. Talk to your data. Our Groq AI integrated
                assistant can dynamically log transactions, warn you if you&apos;re
                overspending, and summarize your remaining limits instantaneously.
              </p>

              {/* Feature bullets */}
              <div className="space-y-3 mt-8">
                {[
                  "Natural language expense logging",
                  "Real-time budget alerts",
                  "Category-wise spending analysis",
                ].map((feat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{feat}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 w-full max-w-md"
          >
            <Card className="border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl relative overflow-hidden gradient-border">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <CardContent className="p-6 space-y-4">
                {/* Status bar */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pb-3 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono">AI Online</span>
                  </div>
                  <span className="font-mono">Groq LLM</span>
                </div>

                {/* Chat messages */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex justify-end"
                >
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-tr-sm text-sm shadow-sm max-w-[85%]">
                    I spent 500 on groceries today
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="flex justify-start gap-3"
                >
                  <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted/50 border border-border/50 px-4 py-3 rounded-2xl rounded-tl-sm text-sm shadow-sm max-w-[85%]">
                    <motion.span
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="italic text-muted-foreground text-xs block mb-2 font-mono"
                    >
                      <Zap className="w-3 h-3 inline mr-1 text-amber-500" />
                      Executing: addExpense()
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: 0.9 }}
                    >
                      Expense added successfully. You have{" "}
                      <span className="text-primary font-semibold">₹3,200</span>{" "}
                      remaining this week.
                    </motion.span>
                  </div>
                </motion.div>

                {/* Typing indicator */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <div className="flex gap-1">
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-primary/40"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, delay, repeat: Infinity }}
                      />
                    ))}
                  </div>
                  <span className="font-mono">AI is ready for your next command</span>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* 6. CTA SECTION */}
      <section className="py-32 relative overflow-hidden border-t border-border/30">
        {/* Grid background */}
        <div className="absolute inset-0 futuristic-grid opacity-40" />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/[0.12] blur-[150px] rounded-full pointer-events-none -z-10 animate-glow-pulse" />

        {/* Orbital decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none">
          <div className="absolute inset-0 rounded-full border border-primary/[0.05] animate-orbit" />
        </div>

        <div className="container mx-auto px-4 text-center max-w-3xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Free Beta Access</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-primary/70">
              Take control of your finances today.
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-10">
              Join the next generation of expense tracking. Free while in beta.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 shadow-xl shadow-primary/25 glow-primary relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center">
                    Create Account <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base border-border/50 bg-background/50 hover:bg-muted/50 backdrop-blur-sm transition-all active:scale-95"
                >
                  Start Tracking
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
