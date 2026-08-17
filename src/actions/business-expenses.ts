"use server";

import { createClient } from "@/lib/supabase/server";
import { getBusinessSession } from "@/lib/auth/business-session";
import { revalidatePath } from "next/cache";

async function requireBusinessSession() {
  const session = await getBusinessSession();
  if (!session) throw new Error("Not authenticated");
  const supabase = await createClient();
  return { supabase, session };
}

export async function getBusinessExpenses(filters?: {
  status?: string;
  category?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { supabase, session } = await requireBusinessSession();

  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("business_expenses")
    .select(
      `id, amount, category, subcategory, description, expense_date, status,
       notes, created_at,
       submitter:submitted_by(id, email),
       approver:approved_by(id, email)`,
      { count: "exact" }
    )
    .eq("business_id", session.businessId)
    .order("expense_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.from) {
    query = query.gte("expense_date", filters.from);
  }
  if (filters?.to) {
    query = query.lte("expense_date", filters.to);
  }
  if (filters?.search) {
    query = query.or(
      `description.ilike.%${filters.search}%,category.ilike.%${filters.search}%`
    );
  }

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);
  return { expenses: data ?? [], total: count ?? 0 };
}

export async function submitBusinessExpense(formData: FormData) {
  const { supabase, session } = await requireBusinessSession();

  const amount = parseFloat(formData.get("amount") as string);
  const category = formData.get("category") as string;
  const subcategory = (formData.get("subcategory") as string) || null;
  const description = (formData.get("description") as string)?.trim();
  const expenseDate = formData.get("expenseDate") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!amount || !category || !description || !expenseDate) {
    return { error: "Amount, category, description and date are required" };
  }
  if (isNaN(amount) || amount <= 0) {
    return { error: "Amount must be a positive number" };
  }

  const { error } = await supabase.from("business_expenses").insert({
    business_id: session.businessId,
    submitted_by: session.userId,
    amount,
    category,
    subcategory,
    description,
    expense_date: expenseDate,
    notes,
    status: "pending",
  });

  if (error) return { error: error.message };

  revalidatePath("/business/expenses");
  revalidatePath("/business/dashboard");
  return { success: true };
}

export async function approveExpense(expenseId: string) {
  const { supabase, session } = await requireBusinessSession();

  if (session.role === "member") {
    return { error: "Only owners and admins can approve expenses" };
  }

  const { error } = await supabase
    .from("business_expenses")
    .update({ status: "approved", approved_by: session.userId })
    .eq("id", expenseId)
    .eq("business_id", session.businessId);

  if (error) return { error: error.message };

  revalidatePath("/business/expenses");
  revalidatePath("/business/dashboard");
  return { success: true };
}

export async function rejectExpense(expenseId: string) {
  const { supabase, session } = await requireBusinessSession();

  if (session.role === "member") {
    return { error: "Only owners and admins can reject expenses" };
  }

  const { error } = await supabase
    .from("business_expenses")
    .update({ status: "rejected", approved_by: session.userId })
    .eq("id", expenseId)
    .eq("business_id", session.businessId);

  if (error) return { error: error.message };

  revalidatePath("/business/expenses");
  return { success: true };
}

export async function deleteBusinessExpense(expenseId: string) {
  const { supabase, session } = await requireBusinessSession();

  if (session.role === "member") {
    return { error: "Only owners and admins can delete expenses" };
  }

  const { error } = await supabase
    .from("business_expenses")
    .delete()
    .eq("id", expenseId)
    .eq("business_id", session.businessId);

  if (error) return { error: error.message };

  revalidatePath("/business/expenses");
  revalidatePath("/business/dashboard");
  return { success: true };
}

export async function getBusinessDashboardStats() {
  const { supabase, session } = await requireBusinessSession();

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const { data: allExpenses } = await supabase
    .from("business_expenses")
    .select("amount, status, category, expense_date")
    .eq("business_id", session.businessId);

  const { data: monthExpenses } = await supabase
    .from("business_expenses")
    .select("amount, status, category")
    .eq("business_id", session.businessId)
    .gte("expense_date", firstOfMonth);

  const { data: members } = await supabase
    .from("business_members")
    .select("id")
    .eq("business_id", session.businessId);

  const { data: categories } = await supabase
    .from("business_categories")
    .select("name, monthly_budget")
    .eq("business_id", session.businessId);

  const totalSpend = (allExpenses ?? [])
    .filter((e) => e.status === "approved")
    .reduce((s, e) => s + Number(e.amount), 0);

  const monthSpend = (monthExpenses ?? [])
    .filter((e) => e.status === "approved")
    .reduce((s, e) => s + Number(e.amount), 0);

  const pendingCount = (allExpenses ?? []).filter(
    (e) => e.status === "pending"
  ).length;

  const pendingAmount = (allExpenses ?? [])
    .filter((e) => e.status === "pending")
    .reduce((s, e) => s + Number(e.amount), 0);

  // Category breakdown for this month
  const categoryBreakdown: Record<string, number> = {};
  (monthExpenses ?? [])
    .filter((e) => e.status === "approved")
    .forEach((e) => {
      categoryBreakdown[e.category] =
        (categoryBreakdown[e.category] ?? 0) + Number(e.amount);
    });

  return {
    totalSpend,
    monthSpend,
    pendingCount,
    pendingAmount,
    memberCount: members?.length ?? 0,
    categoryBreakdown,
    categories: categories ?? [],
  };
}

export async function getBusinessCategories() {
  const { supabase, session } = await requireBusinessSession();

  const { data } = await supabase
    .from("business_categories")
    .select("id, name, monthly_budget")
    .eq("business_id", session.businessId)
    .order("name");

  return data ?? [];
}

export async function getBusinessMembers() {
  const { supabase, session } = await requireBusinessSession();

  const { data } = await supabase
    .from("business_members")
    .select("id, role, joined_at, users(id, email)")
    .eq("business_id", session.businessId)
    .order("joined_at");

  return data ?? [];
}

export async function updateMemberRole(memberId: string, newRole: "admin" | "member" | "sales") {
  const { supabase, session } = await requireBusinessSession();

  if (session.role !== "owner") {
    return { error: "Only the owner can change roles" };
  }

  const { error } = await supabase
    .from("business_members")
    .update({ role: newRole })
    .eq("id", memberId)
    .eq("business_id", session.businessId);

  if (error) return { error: error.message };

  revalidatePath("/business/members");
  return { success: true };
}

export async function removeMember(memberId: string) {
  const { supabase, session } = await requireBusinessSession();

  if (session.role !== "owner") {
    return { error: "Only the owner can remove members" };
  }

  const { error } = await supabase
    .from("business_members")
    .delete()
    .eq("id", memberId)
    .eq("business_id", session.businessId)
    .neq("role", "owner");

  if (error) return { error: error.message };

  revalidatePath("/business/members");
  return { success: true };
}
