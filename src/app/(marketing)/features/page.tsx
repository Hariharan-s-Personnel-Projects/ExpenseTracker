"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bot,
  Wallet,
  PieChart,
  ShieldCheck,
  MessageSquare,
  TrendingUp,
  Bell,
  Smartphone,
  Zap,
  BarChart3,
  Receipt,
  Globe,
} from "lucide-react";

const features = [
  {
    title: "AI Chat Assistant",
    desc: "Tell the AI what you spent in natural language. It logs the expense, picks the category, and confirms — all in a conversational chat interface.",
    icon: Bot,
  },
  {
    title: "Smart Budget Tracking",
    desc: "Set a monthly budget and let the system calculate your optimal weekly spending limit automatically. Stay on track effortlessly.",
    icon: Wallet,
  },
  {
    title: "Spending Analytics",
    desc: "Interactive charts show your weekly spending trends and category breakdowns, so you can see exactly where your money goes.",
    icon: PieChart,
  },
  {
    title: "Secure Authentication",
    desc: "Sign in with email/password or Google OAuth. Your data is protected by enterprise-grade Supabase row-level security policies.",
    icon: ShieldCheck,
  },
  {
    title: "Natural Language Logging",
    desc: "Just type 'Spent 200 on groceries' and the AI parses the amount, category, and date — no forms needed.",
    icon: MessageSquare,
  },
  {
    title: "Real-Time Insights",
    desc: "Instantly see how much you've spent this week, how much is left in your budget, and whether you're on track.",
    icon: TrendingUp,
  },
  {
    title: "Tool-Calling AI",
    desc: "The AI doesn't just chat — it can add, edit, and delete expenses on your behalf using intelligent tool calls.",
    icon: Zap,
  },
  {
    title: "Category Breakdown",
    desc: "Visual donut charts show your spending distribution across categories like Food, Transport, Shopping, and more.",
    icon: BarChart3,
  },
  {
    title: "Expense Management",
    desc: "View, search, edit, and delete any expense from a clean table view. Full control over your transaction history.",
    icon: Receipt,
  },
  {
    title: "Dark & Light Themes",
    desc: "Switch between a clean light mode and a deep-space dark mode. Both designed for comfortable, extended use.",
    icon: Globe,
  },
  {
    title: "Responsive Design",
    desc: "Fully responsive across desktop, tablet, and mobile devices. Track expenses on the go from any screen size.",
    icon: Smartphone,
  },
  {
    title: "Weekly Budget Alerts",
    desc: "Visual progress bars and color-coded indicators warn you when you're approaching or exceeding your weekly limit.",
    icon: Bell,
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-primary/80">
            Everything you need to master your money
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tracker AI combines intelligent automation with beautiful design to
            give you full clarity and control over your finances.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {features.map((feat, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="h-full bg-card/60 border-border/40 backdrop-blur-sm hover:bg-card/80 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.05] transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 group-hover:bg-primary/20 group-hover:shadow-sm group-hover:shadow-primary/20 transition-all">
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
        </motion.div>
      </div>
    </div>
  );
}
