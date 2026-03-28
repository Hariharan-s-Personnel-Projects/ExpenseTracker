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

// ─── Income Types ──────────────────────────────────────────────────────────

export type IncomeSource =
  | "Salary"
  | "Freelance"
  | "Side Hustle"
  | "Rental"
  | "Dividends"
  | "Interest"
  | "Business"
  | "Gift"
  | "Other";

export interface Income {
  id: string;
  user_id: string;
  source: string;
  amount: number;
  income_date: string;
  is_recurring: boolean;
  notes?: string;
  created_at: string;
}

export type CreateIncomePayload = Omit<Income, "id" | "user_id" | "created_at">;
export type UpdateIncomePayload = Partial<CreateIncomePayload> & { id: string };

export interface MonthlyIncomeSummary {
  totalIncome: number;
  bySource: { source: string; amount: number; percentage: number }[];
  recurringIncome: number;
  oneTimeIncome: number;
}

// ─── Savings Types ─────────────────────────────────────────────────────────

export type SavingsCategory =
  | "General"
  | "Emergency"
  | "Retirement"
  | "Goal-Based";

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface SavingsTransaction {
  id: string;
  savings_id: string;
  user_id: string;
  amount: number;
  transaction_type: "deposit" | "withdrawal";
  notes?: string;
  transaction_date: string;
  created_at: string;
}

export type CreateSavingsGoalPayload = Omit<
  SavingsGoal,
  "id" | "user_id" | "created_at" | "saved_amount"
> & { saved_amount?: number };
export type CreateSavingsTransactionPayload = Omit<
  SavingsTransaction,
  "id" | "user_id" | "created_at"
>;

export interface SavingsSummary {
  totalSaved: number;
  totalTargets: number;
  activeGoals: number;
  completedGoals: number;
  overallProgress: number;
}

// ─── Investment Types ──────────────────────────────────────────────────────

export type InvestmentType =
  | "Stocks"
  | "Mutual Funds"
  | "FD"
  | "PPF"
  | "Gold"
  | "Crypto"
  | "Real Estate"
  | "Other";

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  type: string;
  invested_amount: number;
  current_value: number;
  units?: number;
  purchase_date?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export type CreateInvestmentPayload = Omit<
  Investment,
  "id" | "user_id" | "created_at"
>;
export type UpdateInvestmentPayload = Partial<CreateInvestmentPayload> & {
  id: string;
};

export interface InvestmentSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalReturns: number;
  returnPercentage: number;
  byType: {
    type: string;
    invested: number;
    currentValue: number;
    returns: number;
  }[];
}

// ─── Lending Types ─────────────────────────────────────────────────────────

export type LendingType = "lent" | "borrowed";
export type LendingStatus = "pending" | "partial" | "settled";

export interface Lending {
  id: string;
  user_id: string;
  person_name: string;
  amount: number;
  type: LendingType;
  status: LendingStatus;
  settled_amount: number;
  due_date?: string;
  notes?: string;
  created_at: string;
}

export interface LendingTransaction {
  id: string;
  lending_id: string;
  user_id: string;
  amount: number;
  transaction_date: string;
  notes?: string;
  created_at: string;
}

export type CreateLendingPayload = Omit<
  Lending,
  "id" | "user_id" | "created_at" | "settled_amount" | "status"
>;
export type CreateLendingTransactionPayload = Omit<
  LendingTransaction,
  "id" | "user_id" | "created_at"
>;

export interface LendingSummary {
  totalLent: number;
  totalBorrowed: number;
  pendingLent: number;
  pendingBorrowed: number;
  settledLent: number;
  settledBorrowed: number;
}

// ─── Money Flow Overview ───────────────────────────────────────────────────

export interface MoneyFlowSummary {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  totalInvested: number;
  netLending: number; // lent - borrowed
  netCashFlow: number; // income - expenses - savings - investments
  month: string;
}
