import { PublicNavbar } from "@/components/layout/public-navbar";
import { ReactNode } from "react";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground relative flex flex-col pt-16">
      {/* Background ambient gradients — futuristic multi-orb */}
      <div className="fixed top-0 inset-x-0 h-screen overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/[0.06] blur-[150px] animate-glow-pulse" />
        <div
          className="absolute top-[30%] -right-[15%] w-[45%] h-[45%] rounded-full bg-chart-2/[0.05] blur-[130px] animate-glow-pulse"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute bottom-[10%] left-[20%] w-[35%] h-[35%] rounded-full bg-chart-3/[0.04] blur-[100px] animate-glow-pulse"
          style={{ animationDelay: "3s" }}
        />
      </div>

      <PublicNavbar />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
