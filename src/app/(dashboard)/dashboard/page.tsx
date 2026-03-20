import { BudgetCard } from "@/components/expenses/budget-card";
import { SpendingChart } from "@/components/charts/spending-chart";
import { CategoryChart } from "@/components/charts/category-chart";
import { RecentExpenses } from "@/components/expenses/recent-expenses";
import { AiQuickInput } from "@/components/ai/ai-quick-input";

export default function DashboardPage() {
  return (
    <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Welcome back. Here&apos;s your financial overview.
        </p>
      </div>

      {/* AI Quick Input */}
      <AiQuickInput />

      {/* Row 1: Budget + Weekly Spending Chart */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <BudgetCard />
        </div>
        <div className="lg:col-span-2">
          <SpendingChart />
        </div>
      </div>

      {/* Row 2: Category Chart full width */}
      <div>
        <CategoryChart />
      </div>

      {/* Row 3: Recent Expenses */}
      <div>
        <RecentExpenses />
      </div>
    </div>
  );
}
