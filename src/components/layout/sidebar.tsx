"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  Settings,
  LogOut,
  X,
  Sparkles,
  Target,
  Wallet,
  TrendingUp,
  HandCoins,
  ArrowDownUp,
  BotMessageSquare,
  Landmark,
  ChartPie,
} from "lucide-react";
import { logout } from "@/actions/auth";
import { useSidebarStore } from "@/store/useSidebarStore";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    section: "Overview",
  },
  {
    name: "Cash Flow",
    href: "/money-flow",
    icon: ArrowDownUp,
    section: "Overview",
  },
  { name: "Earnings", href: "/income", icon: Wallet, section: "Finance" },
  { name: "Expenses", href: "/expenses", icon: Receipt, section: "Finance" },
  {
    name: "Log Expense",
    href: "/add-expense",
    icon: PlusCircle,
    section: "Finance",
  },
  { name: "Budgets", href: "/budget", icon: ChartPie, section: "Planning" },
  {
    name: "Savings Goals",
    href: "/savings",
    icon: Target,
    section: "Planning",
  },
  {
    name: "Investments",
    href: "/investments",
    icon: TrendingUp,
    section: "Planning",
  },
  {
    name: "Lend & Borrow",
    href: "/lending",
    icon: HandCoins,
    section: "Planning",
  },
  {
    name: "AI Copilot",
    href: "/ai-assistant",
    icon: BotMessageSquare,
    section: "Tools",
  },
  { name: "Settings", href: "/settings", icon: Settings, section: "Tools" },
];

function SidebarContent() {
  const pathname = usePathname();
  const close = useSidebarStore((s) => s.close);

  // Group items by section
  const sections: { label: string; items: typeof navItems }[] = [];
  let currentSection = "";
  navItems.forEach((item) => {
    if (item.section !== currentSection) {
      currentSection = item.section;
      sections.push({ label: currentSection, items: [] });
    }
    sections[sections.length - 1].items.push(item);
  });

  return (
    <>
      <div className="p-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight leading-none">
              Tracker AI
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase mt-0.5">
              Finance Manager
            </span>
          </div>
        </div>
        <button
          onClick={close}
          className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 active:scale-90"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em]">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={close}
                    className="block relative group"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-indicator"
                        className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                    <div
                      className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}
                    >
                      <item.icon
                        className={`h-4 w-4 transition-transform duration-200 ${!isActive ? "group-hover:scale-110" : ""}`}
                      />
                      <span className="text-sm">{item.name}</span>
                      {isActive && (
                        <motion.div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-full"
                          layoutId="sidebar-active-bar"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 mt-auto space-y-2">
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-muted/30">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Theme
          </span>
          <ThemeToggle />
        </div>
        <div className="border-t border-border/30" />
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 active:scale-[0.97]"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Log out</span>
          </button>
        </form>
      </div>
    </>
  );
}

export function Sidebar() {
  const { isOpen, close } = useSidebarStore();
  const pathname = usePathname();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex w-64 fixed inset-y-0 left-0 z-50 flex-col border-r border-border bg-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar — overlay drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={close}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r border-border bg-background lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
