"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLendings,
  createLending,
  updateLending,
  deleteLending,
  addLendingTransaction,
  getLendingTransactions,
  getLendingSummary,
} from "@/actions/lending";
import { CreateLendingPayload, CreateLendingTransactionPayload } from "@/types";
import { toast } from "sonner";

export function useLendings() {
  return useQuery({
    queryKey: ["lendings"],
    queryFn: () => getLendings(),
  });
}

export function useLendingSummary() {
  return useQuery({
    queryKey: ["lendingSummary"],
    queryFn: () => getLendingSummary(),
  });
}

export function useLendingTransactions(lendingId: string) {
  return useQuery({
    queryKey: ["lendingTransactions", lendingId],
    queryFn: () => getLendingTransactions(lendingId),
    enabled: !!lendingId,
  });
}

export function useCreateLending() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLendingPayload) => createLending(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lendings"] });
      queryClient.invalidateQueries({ queryKey: ["lendingSummary"] });
      queryClient.invalidateQueries({ queryKey: ["moneyFlow"] });
      toast.success("Record added");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add record");
    },
  });
}

export function useUpdateLending() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: string;
      updates: Parameters<typeof updateLending>[1];
    }) => updateLending(data.id, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lendings"] });
      queryClient.invalidateQueries({ queryKey: ["lendingSummary"] });
      queryClient.invalidateQueries({ queryKey: ["moneyFlow"] });
      toast.success("Record updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update record");
    },
  });
}

export function useDeleteLending() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLending(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lendings"] });
      queryClient.invalidateQueries({ queryKey: ["lendingSummary"] });
      queryClient.invalidateQueries({ queryKey: ["moneyFlow"] });
      toast.success("Record deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete record");
    },
  });
}

export function useAddLendingTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLendingTransactionPayload) =>
      addLendingTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lendings"] });
      queryClient.invalidateQueries({ queryKey: ["lendingSummary"] });
      queryClient.invalidateQueries({ queryKey: ["lendingTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["moneyFlow"] });
      toast.success("Payment recorded");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record payment");
    },
  });
}
