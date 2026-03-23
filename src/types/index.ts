export type ExpenseCategory =
  | "Food"
  | "Transport"
  | "Shopping"
  | "Entertainment"
  | "Housing"
  | "Utilities"
  | "Other";

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  major_category: string;
  category: string;
  description?: string;
  expense_date: string;
  created_at: string;
}

export type CreateExpensePayload = Omit<
  Expense,
  "id" | "user_id" | "created_at"
>;
export type UpdateExpensePayload = Partial<CreateExpensePayload> & {
  id: string;
};

export interface BudgetSummary {
  monthlyBudget: number;
  weeklyLimit: number;
  spentThisWeek: number;
  remainingThisWeek: number;
}

// Weekly budget breakdown for a single week in the month
export interface WeekBreakdown {
  weekNumber: number;
  weekStart: string; // ISO date string
  weekEnd: string; // ISO date string
  daysInWeek: number;
  baseBudget: number; // auto-calculated
  overrideBudget: number | null; // manual override
  effectiveBudget: number; // with carry-forward applied
  spent: number;
  remaining: number;
  isCurrentWeek: boolean;
}

// Full monthly budget overview
export interface MonthlyBudgetOverview {
  monthlyBudget: number;
  totalSpent: number;
  totalRemaining: number;
  dailyBudget: number; // dynamic: remaining / remaining days
  weeks: WeekBreakdown[];
  currentWeekIndex: number;
}

// Category quota
export interface CategoryQuota {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
  created_at: string;
}

// Category spending summary
export interface CategorySpending {
  category: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  percentage: number;
}

// Monthly overview for dashboard charts
export interface MonthlyExpenseOverview {
  totalSpent: number;
  byCategory: { category: string; amount: number; percentage: number }[];
  byWeek: { weekLabel: string; amount: number }[];
}
