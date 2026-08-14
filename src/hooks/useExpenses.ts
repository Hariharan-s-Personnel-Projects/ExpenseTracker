"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getExpenses,
  getBudgetSummary,
  createExpense,
  createBulkExpenses,
  updateExpense,
  deleteExpense,
  getUserBudget,
  updateUserBudget,
} from "@/actions/expenses";
import { CreateExpensePayload, UpdateExpensePayload } from "@/types";
import { toast } from "sonner"; // Assuming shadcn uses sonner

export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: () => getExpenses(),
  });
}

export function useBudgetSummary() {
  return useQuery({
    queryKey: ["budgetSummary"],
    queryFn: () => getBudgetSummary(),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExpensePayload) => createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["budgetSummary"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyBudgetOverview"] });
      queryClient.invalidateQueries({ queryKey: ["categorySpending"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyExpenseOverview"] });
      toast.success("Expense added successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add expense");
    },
  });
}

export function useCreateBulkExpenses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenses: CreateExpensePayload[]) => createBulkExpenses(expenses),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["budgetSummary"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyBudgetOverview"] });
      queryClient.invalidateQueries({ queryKey: ["categorySpending"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyExpenseOverview"] });
      toast.success(
        `${data.count} expense${data.count !== 1 ? "s" : ""} added successfully`,
      );
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add expenses");
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateExpensePayload) => updateExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["budgetSummary"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyBudgetOverview"] });
      queryClient.invalidateQueries({ queryKey: ["categorySpending"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyExpenseOverview"] });
      toast.success("Expense updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update expense");
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["budgetSummary"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyBudgetOverview"] });
      queryClient.invalidateQueries({ queryKey: ["categorySpending"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyExpenseOverview"] });
      toast.success("Expense deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete expense");
    },
  });
}

export function useUserBudget() {
  return useQuery({
    queryKey: ["userBudget"],
    queryFn: () => getUserBudget(),
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (monthlyBudget: number) => updateUserBudget(monthlyBudget),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userBudget"] });
      queryClient.invalidateQueries({ queryKey: ["budgetSummary"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyBudgetOverview"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyExpenseOverview"] });
      queryClient.invalidateQueries({ queryKey: ["categorySpending"] });
      queryClient.invalidateQueries({ queryKey: ["moneyFlow"] });
      toast.success("Budget updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update budget");
    },
  });
}
