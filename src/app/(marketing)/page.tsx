"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bot,
  Building2,
  Check,
  PieChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

/* ------------------------------------------------------------------ */
/*  Main landing page                                                  */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO */}
      <section className="pt-32 pb-20 md:pt-44 md:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Now in Beta — Free Access</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 text-foreground">
              Smart Expense Tracking, <br className="hidden md:block" />
              Powered by AI
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              Track spending, set budgets, and get instant insights — all
              through a simple conversation with your AI assistant.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link href="/signup">
                <Button size="lg" className="h-11 px-6 text-sm font-medium">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 px-6 text-sm font-medium"
                >
                  Live Demo
                </Button>
              </Link>
              <Link href="/business/login">
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-11 px-6 text-sm font-medium gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Building2 className="h-4 w-4" />
                  For Business
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 sm:mt-20 mx-auto max-w-4xl hidden sm:block"
          >
            <div className="rounded-xl border border-border bg-card shadow-lg overflow-hidden">
              {/* Browser chrome */}
              <div className="h-10 border-b border-border bg-muted/40 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-muted/50 rounded-md px-3 py-0.5 text-xs text-muted-foreground font-mono">
                    tracker-ai.app/dashboard
                  </div>
                </div>
              </div>

              {/* Mock dashboard content */}
              <div className="p-6 sm:p-8 grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Monthly Budget
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    ₹24,500
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-3 h-3" />
                    12% under limit
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    This Week
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    ₹3,200
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                    <Wallet className="w-3 h-3" />
                    of ₹5,000 limit
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-background p-4 col-span-2 lg:col-span-1">
                  <div className="text-xs text-muted-foreground mb-2">
                    Top Categories
                  </div>
                  {[
                    { name: "Food", pct: 35 },
                    { name: "Transport", pct: 22 },
                    { name: "Shopping", pct: 18 },
                  ].map((cat) => (
                    <div key={cat.name} className="mb-1.5 last:mb-0">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-foreground/80">{cat.name}</span>
                        <span className="text-muted-foreground">
                          {cat.pct}%
                        </span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60"
                          style={{ width: `${cat.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat preview spanning full width */}
                <div className="col-span-2 lg:col-span-3 rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                    <Bot className="w-3 h-3 text-primary" />
                    AI Assistant
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg rounded-tr-sm max-w-[70%]">
                        Log my 150 rupee lunch
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-6 w-6 shrink-0 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <Bot className="h-3 w-3 text-primary" />
                      </div>
                      <div className="bg-muted px-3 py-1.5 rounded-lg rounded-tl-sm max-w-[70%]">
                        Done! You have{" "}
                        <span className="font-medium text-primary">₹1,200</span>{" "}
                        remaining this week.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 border-y border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10,000+", label: "Transactions Tracked" },
              { value: "500+", label: "Active Users" },
              { value: "99%", label: "Uptime" },
              { value: "<5s", label: "AI Response" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BUSINESS SECTION */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <motion.div {...fadeIn} className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                <Building2 className="h-4 w-4" />
                For Teams &amp; Business
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Expense management for your entire team
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Set up a business account, invite your team, and manage every
                expense with role-based approvals and real-time budget tracking.
              </p>
              <ul className="space-y-3 pt-1">
                {[
                  "Submit, approve, and reject expenses in one click",
                  "Category budgets with live spend vs. limit tracking",
                  "Owner, Admin, and Member roles with access control",
                  "Shareable invite code — team members join instantly",
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {feat}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/business/signup">
                  <Button className="h-11 px-6 text-sm font-medium gap-2">
                    <Building2 className="h-4 w-4" />
                    Register your Business
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/business/login">
                  <Button variant="outline" className="h-11 px-6 text-sm font-medium">
                    Sign in to Business
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              {...fadeIn}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex-1 w-full max-w-md"
            >
              <Card className="border-border shadow-md">
                <CardContent className="p-0 overflow-hidden rounded-xl">
                  {/* Mock business dashboard header */}
                  <div className="bg-sidebar border-b border-border px-5 py-4 flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-xl border border-primary/20">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-none">Acme Corp</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Owner · Business</p>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "This Month", value: "₹1.2L" },
                        { label: "Pending", value: "4" },
                        { label: "Members", value: "8" },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                          <p className="text-base font-bold">{s.value}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    {/* Pending approval item */}
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium">Team Lunch · Travel</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">by alice@acme.com</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">₹3,400</span>
                          <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full">Pending</span>
                        </div>
                      </div>
                    </div>
                    {/* Category bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Marketing</span>
                        <span className="font-medium">₹48,000 / ₹60,000</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: "80%" }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <motion.div {...fadeIn} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything you need to manage your money
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Purpose-built tools for clarity and control over your financial
              life.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: "AI Assistant",
                desc: "Add expenses through natural conversation. Just tell the AI what you spent.",
                icon: Bot,
              },
              {
                title: "Smart Budgets",
                desc: "Monthly budgets with automatic weekly limits and real-time tracking.",
                icon: Wallet,
              },
              {
                title: "Spending Insights",
                desc: "Visual analytics, trend charts, and category breakdowns at a glance.",
                icon: PieChart,
              },
              {
                title: "Secure Data",
                desc: "Enterprise-grade authentication with encrypted data at rest.",
                icon: ShieldCheck,
              },
            ].map((feat, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feat.icon className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1.5">{feat.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feat.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 sm:py-24 border-y border-border px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div {...fadeIn} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              How it works
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Three simple steps to financial clarity.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                step: "01",
                title: "Set your budget",
                desc: "Establish your monthly allowance and we'll calculate optimal weekly limits.",
              },
              {
                step: "02",
                title: "Track daily",
                desc: "Log transactions manually or tell the AI what you bought.",
              },
              {
                step: "03",
                title: "Gain insights",
                desc: "Chat with AI for feedback on spending trends and remaining limits.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                {...fadeIn}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-full border border-border bg-muted/50 flex items-center justify-center text-lg font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI SHOWCASE */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <motion.div {...fadeIn} className="flex-1 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Bot className="h-4 w-4" />
              AI-Powered
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Your personal financial analyst
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Don&apos;t just view charts — talk to your data. The AI assistant
              can log transactions, warn about overspending, and summarize
              remaining limits instantly.
            </p>
            <ul className="space-y-2.5 pt-2">
              {[
                "Natural language expense logging",
                "Real-time budget alerts",
                "Category-wise spending analysis",
              ].map((feat, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2.5 text-sm text-muted-foreground"
                >
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  {feat}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            {...fadeIn}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex-1 w-full max-w-md"
          >
            <Card className="border-border shadow-md">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>AI Online</span>
                  </div>
                  <span>Groq LLM</span>
                </div>

                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground px-3.5 py-2 rounded-xl rounded-tr-sm text-sm max-w-[85%]">
                    I spent 500 on groceries today
                  </div>
                </div>

                <div className="flex justify-start gap-2.5">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-muted px-3.5 py-2 rounded-xl rounded-tl-sm text-sm max-w-[85%]">
                    <span className="text-muted-foreground text-xs block mb-1">
                      <Zap className="w-3 h-3 inline mr-1 text-amber-500" />
                      addExpense()
                    </span>
                    Expense added. You have{" "}
                    <span className="text-primary font-medium">
                      ₹3,200
                    </span>{" "}
                    remaining this week.
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32 border-t border-border px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <motion.div {...fadeIn} className="grid md:grid-cols-2 gap-6">
            {/* Personal CTA */}
            <div className="rounded-2xl border border-border bg-muted/20 p-8 flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg leading-none">Personal</p>
                  <p className="text-xs text-muted-foreground mt-0.5">For individuals</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                Track personal expenses, set budgets, chat with AI, and stay on top of savings goals — all in one place.
              </p>
              <div className="flex gap-3">
                <Link href="/signup" className="flex-1">
                  <Button className="w-full h-10 text-sm gap-2">
                    Sign Up Free
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="h-10 px-4 text-sm">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>

            {/* Business CTA */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 flex flex-col gap-5 relative overflow-hidden">
              <div className="absolute top-3 right-3 text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
                New
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-lg leading-none">Business</p>
                  <p className="text-xs text-muted-foreground mt-0.5">For teams &amp; companies</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                Manage team expenses with approval workflows, category budgets, role-based access, and real-time analytics.
              </p>
              <div className="flex gap-3">
                <Link href="/business/signup" className="flex-1">
                  <Button className="w-full h-10 text-sm gap-2">
                    Register Business
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link href="/business/login">
                  <Button variant="outline" className="h-10 px-4 text-sm border-primary/30 hover:border-primary/50">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
