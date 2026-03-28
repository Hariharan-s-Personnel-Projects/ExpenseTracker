"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInvestments,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  getInvestmentSummary,
} from "@/actions/investments";
import { CreateInvestmentPayload, UpdateInvestmentPayload } from "@/types";
import { toast } from "sonner";

export function useInvestments() {
  return useQuery({
    queryKey: ["investments"],
    queryFn: () => getInvestments(),
  });
}

export function useInvestmentSummary() {
  return useQuery({
    queryKey: ["investmentSummary"],
    queryFn: () => getInvestmentSummary(),
  });
}

export function useCreateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvestmentPayload) => createInvestment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      queryClient.invalidateQueries({ queryKey: ["investmentSummary"] });
      queryClient.invalidateQueries({ queryKey: ["moneyFlow"] });
      toast.success("Investment added");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add investment");
    },
  });
}

export function useUpdateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateInvestmentPayload) => updateInvestment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      queryClient.invalidateQueries({ queryKey: ["investmentSummary"] });
      queryClient.invalidateQueries({ queryKey: ["moneyFlow"] });
      toast.success("Investment updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update investment");
    },
  });
}

export function useDeleteInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInvestment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      queryClient.invalidateQueries({ queryKey: ["investmentSummary"] });
      queryClient.invalidateQueries({ queryKey: ["moneyFlow"] });
      toast.success("Investment deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete investment");
    },
  });
}
