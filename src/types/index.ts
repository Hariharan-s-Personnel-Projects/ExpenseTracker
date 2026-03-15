export type ExpenseCategory = 'Food' | 'Transport' | 'Shopping' | 'Entertainment' | 'Housing' | 'Utilities' | 'Other';

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description?: string;
  expense_date: string;
  created_at: string;
}

export type CreateExpensePayload = Omit<Expense, 'id' | 'user_id' | 'created_at'>;
export type UpdateExpensePayload = Partial<CreateExpensePayload> & { id: string };

export interface BudgetSummary {
  monthlyBudget: number;
  weeklyLimit: number;
  spentThisWeek: number;
  remainingThisWeek: number;
}
