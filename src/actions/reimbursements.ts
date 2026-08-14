"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getSessionFromCookies } from "@/lib/auth/session";
import { CreateReimbursementPayload } from "@/types";
import { format, startOfMonth, endOfMonth } from "date-fns";

async function requireUser() {
  const session = await getSessionFromCookies();
  if (!session) throw new Error("Unauthorized access. Please log in.");
  const supabase = await createClient();
  return { supabase, userId: session.userId };
}

export async function getReimbursements(year?: number, month?: number) {
  const { supabase, userId } = await requireUser();

  const now = new Date();
  const target = new Date(year ?? now.getFullYear(), month ?? now.getMonth(), 1);
  const from = format(startOfMonth(target), "yyyy-MM-dd");
  const to = format(endOfMonth(target), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("expense_reimbursements")
    .select("*")
    .eq("user_id", userId)
    .gte("received_date", from)
    .lte("received_date", to)
    .order("received_date", { ascending: false });

  if (error) {
    if (error.code === "42P01") return []; // migration not yet run
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function createReimbursement(data: CreateReimbursementPayload) {
  const { supabase, userId } = await requireUser();

  const { data: row, error } = await supabase
    .from("expense_reimbursements")
    .insert({ user_id: userId, ...data })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return row;
}

export async function deleteReimbursement(id: string) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("expense_reimbursements")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return { success: true };
}
