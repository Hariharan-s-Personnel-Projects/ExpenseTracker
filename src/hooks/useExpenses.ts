"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getExpenses, getBudgetSummary, createExpense, updateExpense, deleteExpense } from '@/actions/expenses'
import { CreateExpensePayload, UpdateExpensePayload } from '@/types'
import { toast } from 'sonner' // Assuming shadcn uses sonner

export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: () => getExpenses(),
  })
}

export function useBudgetSummary() {
  return useQuery({
    queryKey: ['budgetSummary'],
    queryFn: () => getBudgetSummary(),
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateExpensePayload) => createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['budgetSummary'] })
      toast.success("Expense added successfully")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add expense")
    }
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: UpdateExpensePayload) => updateExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['budgetSummary'] })
      toast.success("Expense updated successfully")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update expense")
    }
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['budgetSummary'] })
      toast.success("Expense deleted successfully")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete expense")
    }
  })
}
