"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { ReactNode } from "react";
import { Menu } from "lucide-react";
import { useSidebarStore } from "@/store/useSidebarStore";

function MobileHeader() {
  const open = useSidebarStore((s) => s.open);

  return (
    <header className="lg:hidden sticky top-0 z-40 flex items-center gap-3 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 h-14">
      <button
        onClick={open}
        className="p-2 -ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
          <span className="text-primary font-bold text-sm">₹</span>
        </div>
        <span className="font-semibold text-lg tracking-tight">Tracker AI</span>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
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
