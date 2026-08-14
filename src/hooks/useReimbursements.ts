"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getReimbursements,
  createReimbursement,
  deleteReimbursement,
} from "@/actions/reimbursements";
import { CreateReimbursementPayload } from "@/types";
import { toast } from "sonner";

export function useReimbursements(year?: number, month?: number) {
  return useQuery({
    queryKey: ["reimbursements", year, month],
    queryFn: () => getReimbursements(year, month),
    retry: false,
  });
}

export function useCreateReimbursement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReimbursementPayload) => createReimbursement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reimbursements"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyBudgetOverview"] });
      queryClient.invalidateQueries({ queryKey: ["categorySpending"] });
      toast.success("Contribution recorded");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record contribution");
    },
  });
}

export function useDeleteReimbursement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReimbursement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reimbursements"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyBudgetOverview"] });
      queryClient.invalidateQueries({ queryKey: ["categorySpending"] });
      toast.success("Contribution removed");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove contribution");
    },
  });
}
