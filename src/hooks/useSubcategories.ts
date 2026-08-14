"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "@/actions/subcategories";
import { toast } from "sonner";

export function useSubcategories() {
  return useQuery({
    queryKey: ["subcategories"],
    queryFn: () => getSubcategories(),
    retry: false,
  });
}

export function useCreateSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createSubcategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      toast.success("Subcategory added");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add subcategory");
    },
  });
}

export function useUpdateSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      oldName,
      newName,
    }: {
      id: string;
      oldName: string;
      newName: string;
    }) => updateSubcategory(id, oldName, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Subcategory renamed");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to rename subcategory");
    },
  });
}

export function useDeleteSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSubcategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      toast.success("Subcategory deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete subcategory");
    },
  });
}
