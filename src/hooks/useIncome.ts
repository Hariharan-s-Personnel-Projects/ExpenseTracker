"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
  getMonthlyIncomeSummary,
} from "@/actions/income";
import { CreateIncomePayload, UpdateIncomePayload } from "@/types";
import { toast } from "sonner";

export function useIncomes() {
  return useQuery({
    queryKey: ["incomes"],
    queryFn: () => getIncomes(),
  });
}

export function useMonthlyIncomeSummary(year?: number, month?: number) {
  return useQuery({
    queryKey: ["monthlyIncomeSummary", year, month],
    queryFn: () => getMonthlyIncomeSummary(year, month),
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIncomePayload) => createIncome(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyIncomeSummary"] });
      queryClient.invalidateQueries({ queryKey: ["moneyFlow"] });
      toast.success("Income added successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add income");
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateIncomePayload) => updateIncome(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyIncomeSummary"] });
      queryClient.invalidateQueries({ queryKey: ["moneyFlow"] });
      toast.success("Income updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update income");
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteIncome(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyIncomeSummary"] });
      queryClient.invalidateQueries({ queryKey: ["moneyFlow"] });
      toast.success("Income deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete income");
    },
  });
}
