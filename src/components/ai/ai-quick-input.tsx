"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sparkles, Send } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AiQuickInput() {
  const [input, setInput] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    router.push(`/ai-assistant?prompt=${encodeURIComponent(input.trim())}`);
    setInput("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-sm overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <CardContent className="p-4 sm:p-6 relative z-10">
          <form onSubmit={handleSubmit} className="flex gap-4 items-center">
            <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Message AI... e.g., 'Spent 150 rupees on coffee this morning'"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="bg-transparent border-0 focus-visible:ring-0 shadow-none text-base px-0 placeholder:text-muted-foreground/50 h-auto"
              />
            </div>
            <Button
              type="submit"
              size="icon"
              className="shrink-0 rounded-full h-10 w-10 transition-transform active:scale-95"
              disabled={!input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
