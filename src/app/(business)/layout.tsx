import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getBusinessSession } from "@/lib/auth/business-session";
import { BusinessSidebar } from "@/components/business/sidebar";
import { Menu, Building2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import MobileHeaderClient from "@/components/business/mobile-header";

export default async function BusinessLayout({ children }: { children: ReactNode }) {
  const session = await getBusinessSession();
  if (!session) redirect("/business/login");

  return (
    <div className="min-h-screen bg-background text-foreground flex relative">
      <BusinessSidebar businessName={session.businessName} role={session.role} />
      <main className="flex-1 lg:ml-64 min-w-0 transition-all duration-300">
        <MobileHeaderClient businessName={session.businessName} />
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
