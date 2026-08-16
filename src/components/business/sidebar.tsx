"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  Settings2,
  LogOut,
  X,
  Building2,
  Users,
  BarChart3,
  ShieldCheck,
  BookOpen,
  Tag,
} from "lucide-react";
import { businessLogout } from "@/actions/business-auth";
import { useSidebarStore } from "@/store/useSidebarStore";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface BusinessSidebarProps {
  businessName: string;
  role: "owner" | "admin" | "member";
  industry: string | null;
}

function getNavItems(role: "owner" | "admin" | "member", industry: string | null) {
  const base = [
    { name: "Dashboard", href: "/business/dashboard", icon: LayoutDashboard, section: "Overview" },
    { name: "Analytics", href: "/business/analytics", icon: BarChart3, section: "Overview" },
    { name: "Expenses", href: "/business/expenses", icon: Receipt, section: "Expenses" },
    { name: "Submit Expense", href: "/business/expenses/new", icon: PlusCircle, section: "Expenses" },
    ...(industry === "Retail"
      ? [
          { name: "Product Catalog", href: "/business/catalog", icon: BookOpen, section: "Catalog" },
          { name: "Product Margins", href: "/business/selling", icon: Tag, section: "Catalog" },
        ]
      : []),
  ];

  const adminItems = [
    { name: "Team Members", href: "/business/members", icon: Users, section: "Management" },
    { name: "Approvals", href: "/business/approvals", icon: ShieldCheck, section: "Management" },
    { name: "Settings", href: "/business/settings", icon: Settings2, section: "Management" },
  ];

  if (role === "owner" || role === "admin") {
    return [...base, ...adminItems];
  }
  return base;
}

function SidebarContent({ businessName, role, industry }: BusinessSidebarProps) {
  const pathname = usePathname();
  const close = useSidebarStore((s) => s.close);
  const navItems = getNavItems(role, industry);

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
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-primary/10 p-2 rounded-xl border border-primary/20 shrink-0">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm tracking-tight leading-none truncate">
              {businessName}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase mt-0.5 capitalize">
              {role} · Business
            </span>
          </div>
        </div>
        <button
          onClick={close}
          className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 active:scale-90 shrink-0"
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
                        layoutId="biz-sidebar-active"
                        className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div
                      className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 transition-transform duration-200 ${!isActive ? "group-hover:scale-110" : ""}`} />
                      <span className="text-sm">{item.name}</span>
                      {isActive && (
                        <motion.div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-full"
                          layoutId="biz-sidebar-active-bar"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
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
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Theme</span>
          <ThemeToggle />
        </div>
        <div className="border-t border-border/30" />
        <form action={businessLogout}>
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

export function BusinessSidebar({ businessName, role, industry }: BusinessSidebarProps) {
  const { isOpen, close } = useSidebarStore();
  const pathname = usePathname();

  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <>
      <aside className="hidden lg:flex w-64 fixed inset-y-0 left-0 z-50 flex-col border-r border-border bg-sidebar">
        <SidebarContent businessName={businessName} role={role} industry={industry} />
      </aside>

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
              <SidebarContent businessName={businessName} role={role} industry={industry} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
