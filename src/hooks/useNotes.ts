"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from "@/actions/notes";
import type { StickyNote, CreateNotePayload, UpdateNotePayload } from "@/types";

export function useNotes() {
  return useQuery({
    queryKey: ["notes"],
    queryFn: () => getNotes(),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNotePayload) => createNote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create note");
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateNotePayload) => updateNote(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["notes"] });
      const previous = queryClient.getQueryData<StickyNote[]>(["notes"]);
      queryClient.setQueryData<StickyNote[]>(["notes"], (old) =>
        old?.map((n) => (n.id === payload.id ? { ...n, ...payload } : n)) ?? [],
      );
      return { previous };
    },
    onError: (_err, _payload, context) => {
      queryClient.setQueryData(["notes"], context?.previous);
      toast.error("Failed to save note");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notes"] });
      const previous = queryClient.getQueryData<StickyNote[]>(["notes"]);
      queryClient.setQueryData<StickyNote[]>(["notes"], (old) =>
        old?.filter((n) => n.id !== id) ?? [],
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(["notes"], context?.previous);
      toast.error("Failed to delete note");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}
