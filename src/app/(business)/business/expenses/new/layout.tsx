import { requireNonSalesSession } from "@/lib/auth/guards";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireNonSalesSession();
  return <>{children}</>;
}
