import { PublicNavbar } from "@/components/layout/public-navbar";
import { ReactNode } from "react";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground relative flex flex-col pt-16">
      <PublicNavbar />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
