"use client";

import { motion } from "framer-motion";
import {
  Bot,
  Wallet,
  PieChart,
  ShieldCheck,
  Zap,
  Smartphone,
} from "lucide-react";

const features = [
  {
    title: "AI-Powered Logging",
    desc: "Type naturally. The AI handles the rest — amount, category, and date parsed instantly.",
    icon: Bot,
  },
  {
    title: "Smart Budgeting",
    desc: "Set a monthly budget. Get automatic weekly limits and real-time progress tracking.",
    icon: Wallet,
  },
  {
    title: "Visual Analytics",
    desc: "Weekly trends and category breakdowns at a glance with interactive charts.",
    icon: PieChart,
  },
  {
    title: "Secure by Default",
    desc: "Google OAuth and email auth with Supabase row-level security protecting every row.",
    icon: ShieldCheck,
  },
  {
    title: "AI That Acts",
    desc: "The assistant doesn't just chat — it adds, edits, and deletes expenses for you.",
    icon: Zap,
  },
  {
    title: "Works Everywhere",
    desc: "Fully responsive across desktop, tablet, and mobile. Dark and light themes included.",
    icon: Smartphone,
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] pt-28 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Features
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Everything you need to track, understand, and control your spending.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {features.map((feat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="flex flex-col items-start"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                <feat.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-base mb-1.5">{feat.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
