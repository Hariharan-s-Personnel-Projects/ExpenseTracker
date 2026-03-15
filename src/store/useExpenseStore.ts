import { create } from 'zustand'

export type Expense = {
  id: string
  amount: number
  description: string
  category: string
  date: string
}

interface ExpenseState {
  expenses: Expense[]
  monthlyBudget: number
  isLoading: boolean
  setExpenses: (expenses: Expense[]) => void
  addExpense: (expense: Expense) => void
  setMonthlyBudget: (budget: number) => void
  setLoading: (loading: boolean) => void
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  monthlyBudget: 2000, // Default for UI purposes
  isLoading: false,
  setExpenses: (expenses) => set({ expenses }),
  addExpense: (expense) => set((state) => ({ expenses: [expense, ...state.expenses] })),
  setMonthlyBudget: (monthlyBudget) => set({ monthlyBudget }),
  setLoading: (isLoading) => set({ isLoading }),
}))
