"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getSessionFromCookies } from "@/lib/auth/session";

async function requireUser() {
  const session = await getSessionFromCookies();
  if (!session) throw new Error("Unauthorized access. Please log in.");
  const supabase = await createClient();
  return { supabase, userId: session.userId };
}

export async function getSubcategories() {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("expense_subcategories")
    .select("*")
    .eq("user_id", userId)
    .order("name");
  if (error) {
    if (error.code === "42P01") return []; // migration not yet run
    throw new Error(error.message);
  }
  return data;
}

export async function createSubcategory(name: string) {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("expense_subcategories")
    .insert({ user_id: userId, name: name.trim() })
    .select()
    .single();
  if (error) {
    if (error.code === "23505")
      throw new Error(`"${name}" already exists as a subcategory.`);
    throw new Error(error.message);
  }
  revalidatePath("/budget");
  return data;
}

export async function updateSubcategory(
  id: string,
  oldName: string,
  newName: string,
) {
  const { supabase, userId } = await requireUser();

  const { error: tableErr } = await supabase
    .from("expense_subcategories")
    .update({ name: newName.trim() })
    .eq("id", id)
    .eq("user_id", userId);

  if (tableErr) {
    if (tableErr.code === "23505")
      throw new Error(`"${newName}" already exists as a subcategory.`);
    throw new Error(tableErr.message);
  }

  // Rename matching expenses so history stays consistent
  const { error: expErr } = await supabase
    .from("expenses")
    .update({ category: newName.trim() })
    .eq("user_id", userId)
    .eq("major_category", "Daily Expense")
    .eq("category", oldName);

  if (expErr) throw new Error(expErr.message);

  revalidatePath("/budget");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteSubcategory(id: string) {
  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("expense_subcategories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
  return { success: true };
}
