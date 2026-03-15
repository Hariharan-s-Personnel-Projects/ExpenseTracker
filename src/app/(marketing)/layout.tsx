import { PublicNavbar } from "@/components/layout/public-navbar"
import { ReactNode } from "react"

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground relative flex flex-col pt-16">
      {/* Background ambient gradients */}
      <div className="absolute top-0 inset-x-0 h-screen overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      <PublicNavbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
