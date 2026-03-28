"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  MessageSquare,
  Settings,
  LogOut,
  X,
  Sparkles,
  PiggyBank,
  Wallet,
  TrendingUp,
  HandCoins,
  ArrowRightLeft,
} from "lucide-react";
import { logout } from "@/actions/auth";
import { useSidebarStore } from "@/store/useSidebarStore";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Money Flow", href: "/money-flow", icon: ArrowRightLeft },
  { name: "Income", href: "/income", icon: Wallet },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Add Expense", href: "/add-expense", icon: PlusCircle },
  { name: "Budget & Quotas", href: "/budget", icon: PiggyBank },
  { name: "Savings", href: "/savings", icon: PiggyBank },
  { name: "Investments", href: "/investments", icon: TrendingUp },
  { name: "Lending", href: "/lending", icon: HandCoins },
  { name: "AI Assistant", href: "/ai-assistant", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

function SidebarContent() {
  const pathname = usePathname();
  const close = useSidebarStore((s) => s.close);

  return (
    <>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-xl tracking-tight">
            Tracker AI
          </span>
        </div>
        <button
          onClick={close}
          className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={close}
              className="block relative"
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute inset-0 bg-primary/10 rounded-md border border-primary/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
              <div
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-sm">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto space-y-3">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Theme
          </span>
          <ThemeToggle />
        </div>
        <div className="border-t border-border/50" />
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
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
      <aside className="hidden lg:flex w-64 fixed inset-y-0 left-0 z-50 flex-col border-r border-border/50 bg-sidebar/80 backdrop-blur-xl">
        {/* Sidebar glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.06] blur-[60px] rounded-full pointer-events-none" />
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
              className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r border-border/50 bg-background backdrop-blur-xl lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
