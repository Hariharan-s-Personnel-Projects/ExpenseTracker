"use client";

import { motion } from "framer-motion";

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] items-center justify-center p-8 text-center pt-24">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto mb-12">
          Tracker AI is currently in early access beta. All features are free
          for current users.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="w-full max-w-md rounded-2xl border border-primary/20 bg-background/50 backdrop-blur-xl p-8 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
        <h3 className="text-xl font-semibold mb-2">Early Access</h3>
        <div className="flex items-baseline justify-center gap-1 mb-6">
          <span className="text-5xl font-bold tracking-tighter">₹0</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <ul className="space-y-4 text-sm text-left mb-8">
          {[
            "Unlimited Expenses",
            "Full AI Assistant Access",
            "Advanced Budget Analytics",
          ].map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-primary" /> {item}
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
