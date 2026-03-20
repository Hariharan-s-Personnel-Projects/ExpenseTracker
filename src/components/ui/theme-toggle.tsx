"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-[108px]" />;

  const options = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ] as const;

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border/60 bg-muted/40 backdrop-blur-sm p-0.5">
      {options.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className="relative flex items-center justify-center h-8 w-8 rounded-full transition-colors"
            aria-label={`Switch to ${label} theme`}
          >
            {isActive && (
              <motion.div
                layoutId="theme-toggle-active"
                className="absolute inset-0 rounded-full bg-primary/15 border border-primary/30 shadow-sm shadow-primary/10"
                transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
              />
            )}
            <Icon
              className={`relative h-3.5 w-3.5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            />
          </button>
        );
      })}
    </div>
  );
}
