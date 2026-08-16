"use client";

import { Building2, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSidebarStore } from "@/store/useSidebarStore";

export default function MobileHeaderClient({ businessName }: { businessName: string }) {
  const open = useSidebarStore((s) => s.open);

  return (
    <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background px-4 h-14 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={open}
          className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 active:scale-90"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-xl border border-primary/20">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-sm tracking-tight truncate max-w-[140px]">
            {businessName}
          </span>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
