"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bot,
  PieChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center max-w-5xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Introducing Tracker AI 2.0</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              AI-Powered Personal <br className="hidden md:block" /> Finance
              Tracker
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              Track expenses, control your budget, and let intelligent AI manage
              your money. Built for speed, styled for the future.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
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
            <div className="rounded-xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <div className="h-12 border-b border-border/50 bg-muted/20 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                </div>
              </div>
              <div className="aspect-[16/9] w-full bg-gradient-to-br from-muted/20 via-background to-muted/10 p-8 flex items-center justify-center relative overflow-hidden">
                {/* Fake Glass Cards in Mockup */}
                <div className="absolute top-10 left-10 w-64 h-32 rounded-xl border border-border/50 bg-background/40 backdrop-blur-md shadow-sm p-4 flex flex-col justify-center">
                  <div className="h-4 w-24 bg-muted/50 rounded mb-4" />
                  <div className="h-8 w-32 bg-primary/20 rounded" />
                </div>
                <div className="absolute bottom-10 right-10 w-80 h-48 rounded-xl border border-border/50 bg-background/40 backdrop-blur-md shadow-sm p-4 flex items-end justify-between gap-2">
                  {[45, 72, 38, 91, 55, 67, 80].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/30 rounded-t-sm"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                {/* Chat Mockup */}
                <div className="absolute bottom-10 left-10 w-72 h-40 rounded-xl border border-border/50 bg-background/60 backdrop-blur-md shadow-sm p-4 flex flex-col justify-end space-y-3">
                  <div className="self-end bg-primary/20 p-2 rounded-lg text-xs w-3/4">
                    Log my 150 rupee lunch
                  </div>
                  <div className="self-start bg-muted/50 p-2 rounded-lg text-xs w-4/5 flex items-center gap-2">
                    <Bot size={12} className="text-primary" /> Logged! You have
                    ₹1,200 remaining this week.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. FEATURES SECTION */}
      <section className="py-24 bg-muted/5 border-y border-border/50 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything you need to master your money
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Purpose-built tools designed to give you clarity and control over
              your financial life.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "AI Expense Assistant",
                desc: "Automatically add expenses through natural chat.",
                icon: Bot,
              },
              {
                title: "Smart Budget Tracking",
                desc: "Monthly budgets with automatic weekly limits.",
                icon: Wallet,
              },
              {
                title: "Spending Insights",
                desc: "Visual analytics and trend charts.",
                icon: PieChart,
              },
              {
                title: "Secure Data",
                desc: "Powered by Supabase enterprise authentication.",
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
                <Card className="h-full bg-background/50 border-border/50 backdrop-blur-sm hover:bg-muted/20 transition-colors">
                  <CardContent className="p-6">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                      <feat.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feat.title}</h3>
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

      {/* 3. HOW IT WORKS */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              How it works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Three simple steps to financial clarity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-border/10 via-border to-border/10 -z-10" />

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
                <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center text-xl font-bold font-mono mb-6 shadow-sm">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. AI FEATURE SHOWCASE */}
      <section className="py-24 bg-muted/10 border-y border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary-foreground mb-4 text-sm font-medium">
              <Bot className="h-4 w-4" />
              <span>Tool-calling AI</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Your personal <br /> financial analyst.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Don't just view charts. Talk to your data. Our Grok AI integrated
              assistant can dynamically log transactions, warn you if you're
              overspending, and summarize your remaining limits instantaneously.
            </p>
          </div>

          <div className="flex-1 w-full max-w-md">
            <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <CardContent className="p-6 space-y-6">
                {/* Chat mock */}
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
                    <span className="italic text-muted-foreground text-xs block mb-1">
                      Executing Tool: addExpense
                    </span>
                    Expense added successfully. You have ₹3,200 remaining this
                    week.
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full point-events-none -z-10" />
        <div className="container mx-auto px-4 text-center max-w-3xl relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Take control of your finances today.
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-10">
            Join the next generation of expense tracking. Free while in beta.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="h-12 px-8 text-base bg-foreground text-background hover:bg-foreground/90 transition-all active:scale-95 shadow-xl"
              >
                Create Account
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
        </div>
      </section>
    </div>
  );
}
