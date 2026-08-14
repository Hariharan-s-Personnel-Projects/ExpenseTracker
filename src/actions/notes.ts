"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getSessionFromCookies } from "@/lib/auth/session";
import type { StickyNote, CreateNotePayload, UpdateNotePayload } from "@/types";

async function requireUser() {
  const session = await getSessionFromCookies();
  if (!session) throw new Error("Unauthorized access. Please log in.");
  const supabase = await createClient();
  return { supabase, userId: session.userId };
}

export async function getNotes(): Promise<StickyNote[]> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createNote(payload: CreateNotePayload): Promise<StickyNote> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("notes")
    .insert({ ...payload, user_id: userId })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/notes");
  return data;
}

export async function updateNote(payload: UpdateNotePayload): Promise<StickyNote> {
  const { supabase, userId } = await requireUser();

  const { id, ...rest } = payload;

  const { data, error } = await supabase
    .from("notes")
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/notes");
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/notes");
}
