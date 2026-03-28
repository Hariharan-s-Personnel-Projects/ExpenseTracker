"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getSessionFromCookies } from "@/lib/auth/session";
import {
  CreateLendingPayload,
  CreateLendingTransactionPayload,
  LendingSummary,
  Lending,
  LendingTransaction,
} from "@/types";

async function requireUser() {
  const session = await getSessionFromCookies();
  if (!session) throw new Error("Unauthorized access. Please log in.");
  const supabase = await createClient();
  return { supabase, userId: session.userId };
}

export async function createLending(data: CreateLendingPayload) {
  const { supabase, userId } = await requireUser();

  const { data: lending, error } = await supabase
    .from("lendings")
    .insert({
      user_id: userId,
      person_name: data.person_name,
      amount: data.amount,
      type: data.type,
      status: "pending",
      settled_amount: 0,
      due_date: data.due_date || null,
      notes: data.notes || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/lending");
  revalidatePath("/money-flow");
  return lending;
}

export async function getLendings(): Promise<Lending[]> {
  const { supabase, userId } = await requireUser();

  const { data: lendings, error } = await supabase
    .from("lendings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return lendings || [];
}

export async function updateLending(
  id: string,
  updates: Partial<Omit<Lending, "id" | "user_id" | "created_at">>,
) {
  const { supabase, userId } = await requireUser();

  const { data: lending, error } = await supabase
    .from("lendings")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/lending");
  revalidatePath("/money-flow");
  return lending;
}

export async function deleteLending(id: string) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("lendings")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/lending");
  revalidatePath("/money-flow");
  return { success: true };
}

// ─── Lending Transactions (Repayments) ─────────────────────────────────────

export async function addLendingTransaction(
  data: CreateLendingTransactionPayload,
) {
  const { supabase, userId } = await requireUser();

  // Insert the repayment transaction
  const { data: txn, error: txnError } = await supabase
    .from("lending_transactions")
    .insert({ user_id: userId, ...data })
    .select()
    .single();

  if (txnError) throw new Error(txnError.message);

  // Update the settled_amount + status on the lending record
  const { data: lending } = await supabase
    .from("lendings")
    .select("amount, settled_amount")
    .eq("id", data.lending_id)
    .eq("user_id", userId)
    .single();

  if (lending) {
    const newSettled = Number(lending.settled_amount) + Number(data.amount);
    const totalAmount = Number(lending.amount);
    const newStatus =
      newSettled >= totalAmount
        ? "settled"
        : newSettled > 0
          ? "partial"
          : "pending";

    await supabase
      .from("lendings")
      .update({ settled_amount: newSettled, status: newStatus })
      .eq("id", data.lending_id)
      .eq("user_id", userId);
  }

  revalidatePath("/lending");
  revalidatePath("/money-flow");
  return txn;
}

export async function getLendingTransactions(
  lendingId: string,
): Promise<LendingTransaction[]> {
  const { supabase, userId } = await requireUser();

  const { data: txns, error } = await supabase
    .from("lending_transactions")
    .select("*")
    .eq("lending_id", lendingId)
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false });

  if (error) throw new Error(error.message);
  return txns || [];
}

// ─── Summary ───────────────────────────────────────────────────────────────

export async function getLendingSummary(): Promise<LendingSummary> {
  const { supabase, userId } = await requireUser();

  const { data: lendings, error } = await supabase
    .from("lendings")
    .select("*")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  const all = lendings || [];
  const lent = all.filter((l) => l.type === "lent");
  const borrowed = all.filter((l) => l.type === "borrowed");

  return {
    totalLent: lent.reduce((sum, l) => sum + Number(l.amount), 0),
    totalBorrowed: borrowed.reduce((sum, l) => sum + Number(l.amount), 0),
    pendingLent: lent
      .filter((l) => l.status !== "settled")
      .reduce((sum, l) => sum + Number(l.amount) - Number(l.settled_amount), 0),
    pendingBorrowed: borrowed
      .filter((l) => l.status !== "settled")
      .reduce((sum, l) => sum + Number(l.amount) - Number(l.settled_amount), 0),
    settledLent: lent
      .filter((l) => l.status === "settled")
      .reduce((sum, l) => sum + Number(l.amount), 0),
    settledBorrowed: borrowed
      .filter((l) => l.status === "settled")
      .reduce((sum, l) => sum + Number(l.amount), 0),
  };
}
