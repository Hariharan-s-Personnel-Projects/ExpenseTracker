"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { ReactNode } from "react";
import { Menu, Sparkles } from "lucide-react";
import { useSidebarStore } from "@/store/useSidebarStore";
import { ThemeToggle } from "@/components/ui/theme-toggle";

function MobileHeader() {
  const open = useSidebarStore((s) => s.open);

  return (
    <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background px-4 h-14 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={open}
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 active:scale-90"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-xl border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight">Tracker AI</span>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex relative">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-w-0 transition-all duration-300">
        <MobileHeader />
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
