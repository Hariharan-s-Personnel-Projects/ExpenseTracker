"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  addSavingsTransaction,
  getSavingsTransactions,
  getSavingsSummary,
} from "@/actions/savings";
import {
  CreateSavingsGoalPayload,
  CreateSavingsTransactionPayload,
} from "@/types";
import { toast } from "sonner";

export function useSavingsGoals() {
  return useQuery({
    queryKey: ["savingsGoals"],
    queryFn: () => getSavingsGoals(),
  });
}

export function useSavingsSummary() {
  return useQuery({
    queryKey: ["savingsSummary"],
    queryFn: () => getSavingsSummary(),
  });
}

export function useSavingsTransactions(savingsId: string) {
  return useQuery({
    queryKey: ["savingsTransactions", savingsId],
    queryFn: () => getSavingsTransactions(savingsId),
    enabled: !!savingsId,
  });
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSavingsGoalPayload) => createSavingsGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsGoals"] });
      queryClient.invalidateQueries({ queryKey: ["savingsSummary"] });
      queryClient.invalidateQueries({ queryKey: ["moneyFlow"] });
      toast.success("Savings goal created");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create savings goal");
    },
  });
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: string;
      updates: Parameters<typeof updateSavingsGoal>[1];
    }) => updateSavingsGoal(data.id, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsGoals"] });
      queryClient.invalidateQueries({ queryKey: ["savingsSummary"] });
      queryClient.invalidateQueries({ queryKey: ["moneyFlow"] });
      toast.success("Savings goal updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update savings goal");
    },
  });
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSavingsGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsGoals"] });
      queryClient.invalidateQueries({ queryKey: ["savingsSummary"] });
      queryClient.invalidateQueries({ queryKey: ["moneyFlow"] });
      toast.success("Savings goal deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete savings goal");
    },
  });
}

export function useAddSavingsTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSavingsTransactionPayload) =>
      addSavingsTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsGoals"] });
      queryClient.invalidateQueries({ queryKey: ["savingsSummary"] });
      queryClient.invalidateQueries({ queryKey: ["savingsTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["moneyFlow"] });
      toast.success("Transaction recorded");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record transaction");
    },
  });
}
