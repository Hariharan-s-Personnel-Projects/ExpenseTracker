"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMonthlyBudgetOverview,
  setWeeklyOverride,
  removeWeeklyOverride,
  getCategoryQuotas,
  upsertCategoryQuota,
  deleteCategoryQuota,
  getCategorySpending,
  getMonthlyExpenseOverview,
} from "@/actions/budget";
import { toast } from "sonner";

export function useMonthlyBudgetOverview(year?: number, month?: number) {
  return useQuery({
    queryKey: ["monthlyBudgetOverview", year, month],
    queryFn: () => getMonthlyBudgetOverview(year, month),
  });
}

export function useSetWeeklyOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      weekStart: string;
      weekEnd: string;
      amount: number;
    }) => setWeeklyOverride(data.weekStart, data.weekEnd, data.amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthlyBudgetOverview"] });
      queryClient.invalidateQueries({ queryKey: ["budgetSummary"] });
      toast.success("Weekly budget updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update weekly budget");
    },
  });
}

export function useRemoveWeeklyOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (weekStart: string) => removeWeeklyOverride(weekStart),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthlyBudgetOverview"] });
      queryClient.invalidateQueries({ queryKey: ["budgetSummary"] });
      toast.success("Override removed");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove override");
    },
  });
}

export function useCategoryQuotas() {
  return useQuery({
    queryKey: ["categoryQuotas"],
    queryFn: () => getCategoryQuotas(),
  });
}

export function useUpsertCategoryQuota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { category: string; monthlyLimit: number }) =>
      upsertCategoryQuota(data.category, data.monthlyLimit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categoryQuotas"] });
      queryClient.invalidateQueries({ queryKey: ["categorySpending"] });
      toast.success("Category quota saved");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save quota");
    },
  });
}

export function useDeleteCategoryQuota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategoryQuota(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categoryQuotas"] });
      queryClient.invalidateQueries({ queryKey: ["categorySpending"] });
      toast.success("Category quota deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete quota");
    },
  });
}

export function useCategorySpending() {
  return useQuery({
    queryKey: ["categorySpending"],
    queryFn: () => getCategorySpending(),
  });
}

export function useMonthlyExpenseOverview() {
  return useQuery({
    queryKey: ["monthlyExpenseOverview"],
    queryFn: () => getMonthlyExpenseOverview(),
  });
}
