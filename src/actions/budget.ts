"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getSessionFromCookies } from "@/lib/auth/session";
import {
  MonthlyBudgetOverview,
  WeekBreakdown,
  CategoryQuota,
  CategorySpending,
  MonthlyExpenseOverview,
} from "@/types";
import {
  startOfMonth,
  endOfMonth,
  addDays,
  differenceInCalendarDays,
  isWithinInterval,
  format,
  parseISO,
  startOfDay,
  endOfDay,
} from "date-fns";

async function requireUser() {
  const session = await getSessionFromCookies();
  if (!session) throw new Error("Unauthorized access. Please log in.");
  const supabase = await createClient();
  return { supabase, userId: session.userId };
}

// ─── Week Calculation Helpers ──────────────────────────────────────────────

function getWeekStartDayNumber(weekStartDay: string): number {
  const days: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  return days[weekStartDay.toLowerCase()] ?? 1;
}

/**
 * Split a month into calendar-based weeks.
 * Returns array of { start: Date, end: Date } for each week.
 */
function getWeeksOfMonth(
  year: number,
  month: number, // 0-indexed
  weekStartDayNumber: number,
): { start: Date; end: Date }[] {
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(new Date(year, month, 1));
  const weeks: { start: Date; end: Date }[] = [];

  let current = monthStart;

  while (current <= monthEnd) {
    const currentDay = current.getDay();
    let daysUntilWeekEnd = (weekStartDayNumber - 1 - currentDay + 7) % 7;
    // If current IS the last day of the week cycle (day before weekStart),
    // that means daysUntilWeekEnd = 0, which is fine — it's a 1-day week segment
    if (daysUntilWeekEnd === 0 && current !== monthStart) {
      daysUntilWeekEnd = 6;
    }
    // For the first iteration, handle partial first week
    if (current.getTime() === monthStart.getTime()) {
      // days until the day before next week start
      daysUntilWeekEnd = (weekStartDayNumber - 1 - currentDay + 7) % 7;
      if (daysUntilWeekEnd === 0 && currentDay !== weekStartDayNumber) {
        daysUntilWeekEnd = 6;
      }
      // If month starts on week start day, full week
      if (currentDay === weekStartDayNumber) {
        daysUntilWeekEnd = 6;
      }
    }

    let weekEnd = addDays(current, daysUntilWeekEnd);
    if (weekEnd > monthEnd) weekEnd = monthEnd;

    weeks.push({ start: new Date(current), end: new Date(weekEnd) });

    current = addDays(weekEnd, 1);
  }

  return weeks;
}

// ─── Monthly Budget Overview with Carry-Forward ────────────────────────────

export async function getMonthlyBudgetOverview(
  year?: number,
  month?: number, // 0-indexed
): Promise<MonthlyBudgetOverview> {
  const { supabase, userId } = await requireUser();

  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth();

  const monthStart = startOfMonth(new Date(targetYear, targetMonth, 1));
  const monthEnd = endOfMonth(new Date(targetYear, targetMonth, 1));
  const totalDaysInMonth = differenceInCalendarDays(monthEnd, monthStart) + 1;

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("monthly_budget")
    .eq("id", userId)
    .single();

  const monthlyBudget = profile?.monthly_budget
    ? Number(profile.monthly_budget)
    : 0;

  // Fetch only "Daily Expense" expenses for weekly budget tracking
  // (other major categories are tracked separately via category quotas)
  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount, expense_date")
    .eq("user_id", userId)
    .eq("major_category", "Daily Expense")
    .gte("expense_date", format(monthStart, "yyyy-MM-dd"))
    .lte("expense_date", format(monthEnd, "yyyy-MM-dd"));

  // Fetch weekly overrides
  const { data: overrides } = await supabase
    .from("weekly_budget_overrides")
    .select("*")
    .eq("user_id", userId)
    .gte("week_start", format(monthStart, "yyyy-MM-dd"))
    .lte("week_start", format(monthEnd, "yyyy-MM-dd"));

  // Default week start = monday (1)
  const weekStartDay = 1;
  const weeks = getWeeksOfMonth(targetYear, targetMonth, weekStartDay);

  const today = startOfDay(now);
  let totalSpentSoFar = 0;
  let currentWeekIndex = -1;

  // Build week breakdowns with carry-forward
  const weekBreakdowns: WeekBreakdown[] = [];

  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i];
    const daysInWeek = differenceInCalendarDays(week.end, week.start) + 1;
    const baseBudget = (monthlyBudget / totalDaysInMonth) * daysInWeek;

    // Check for override
    const override = overrides?.find(
      (o) => o.week_start === format(week.start, "yyyy-MM-dd"),
    );
    const overrideBudget = override ? Number(override.amount) : null;

    // Calculate spent for this week
    const weekExpenses =
      expenses?.filter((e) => {
        const d = parseISO(e.expense_date);
        return isWithinInterval(d, {
          start: startOfDay(week.start),
          end: endOfDay(week.end),
        });
      }) ?? [];

    const spent = weekExpenses.reduce(
      (acc, curr) => acc + Number(curr.amount),
      0,
    );

    const isCurrentWeek = isWithinInterval(today, {
      start: startOfDay(week.start),
      end: endOfDay(week.end),
    });

    if (isCurrentWeek) currentWeekIndex = i;

    weekBreakdowns.push({
      weekNumber: i + 1,
      weekStart: format(week.start, "yyyy-MM-dd"),
      weekEnd: format(week.end, "yyyy-MM-dd"),
      daysInWeek,
      baseBudget: Math.round(baseBudget * 100) / 100,
      overrideBudget,
      effectiveBudget: 0, // calculated below
      spent: Math.round(spent * 100) / 100,
      remaining: 0,
      isCurrentWeek,
    });

    totalSpentSoFar += spent;
  }

  // Apply carry-forward logic:
  // For past weeks: effectiveBudget = overrideBudget ?? baseBudget
  // For current/future weeks: redistribute remaining budget across remaining days
  const totalSpent =
    expenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) ?? 0;

  // Calculate remaining days in month from today onwards
  let remainingBudget = monthlyBudget;

  // First pass: determine budgets for past weeks (before current)
  // If a past week was overspent, the overspend cascades into remaining weeks
  for (let i = 0; i < weekBreakdowns.length; i++) {
    const wb = weekBreakdowns[i];
    const weekEnd = parseISO(wb.weekEnd);

    if (endOfDay(weekEnd) < today && !wb.isCurrentWeek) {
      // Past week
      wb.effectiveBudget =
        wb.overrideBudget !== null ? wb.overrideBudget : wb.baseBudget;
      // Deduct the greater of allocated budget or actual spending:
      // - Underspend: deduct budget (unused amount rolls forward)
      // - Overspend: deduct actual spent (excess reduces future weeks)
      remainingBudget -= Math.max(wb.effectiveBudget, wb.spent);
    }
  }

  // Second pass: distribute remaining budget across current + future weeks
  let remainingDays = 0;
  for (let i = 0; i < weekBreakdowns.length; i++) {
    const wb = weekBreakdowns[i];
    const weekEnd = parseISO(wb.weekEnd);
    if (!(endOfDay(weekEnd) < today && !wb.isCurrentWeek)) {
      remainingDays += wb.daysInWeek;
    }
  }

  const newDailyBudget =
    remainingDays > 0 ? remainingBudget / remainingDays : 0;

  for (let i = 0; i < weekBreakdowns.length; i++) {
    const wb = weekBreakdowns[i];
    const weekEnd = parseISO(wb.weekEnd);

    if (!(endOfDay(weekEnd) < today && !wb.isCurrentWeek)) {
      // Current or future week
      if (wb.overrideBudget !== null) {
        wb.effectiveBudget = wb.overrideBudget;
      } else {
        wb.effectiveBudget =
          Math.round(newDailyBudget * wb.daysInWeek * 100) / 100;
      }
    }

    wb.remaining = Math.round((wb.effectiveBudget - wb.spent) * 100) / 100;
  }

  return {
    monthlyBudget,
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalRemaining: Math.round((monthlyBudget - totalSpent) * 100) / 100,
    dailyBudget: Math.round(newDailyBudget * 100) / 100,
    weeks: weekBreakdowns,
    currentWeekIndex,
  };
}

// ─── Weekly Override Management ────────────────────────────────────────────

export async function setWeeklyOverride(
  weekStart: string,
  weekEnd: string,
  amount: number,
) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase.from("weekly_budget_overrides").upsert(
    {
      user_id: userId,
      week_start: weekStart,
      week_end: weekEnd,
      amount,
    },
    { onConflict: "user_id,week_start" },
  );

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/budget");
  return { success: true };
}

export async function removeWeeklyOverride(weekStart: string) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("weekly_budget_overrides")
    .delete()
    .eq("user_id", userId)
    .eq("week_start", weekStart);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/budget");
  return { success: true };
}

// ─── Category Quotas ───────────────────────────────────────────────────────

export async function getCategoryQuotas(): Promise<CategoryQuota[]> {
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("category_quotas")
    .select("*")
    .eq("user_id", userId)
    .order("category");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertCategoryQuota(
  category: string,
  monthlyLimit: number | null,
) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase.from("category_quotas").upsert(
    {
      user_id: userId,
      category,
      monthly_limit: monthlyLimit,
    },
    { onConflict: "user_id,category" },
  );

  if (error) throw new Error(error.message);

  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteCategoryQuota(id: string) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("category_quotas")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return { success: true };
}

// ─── Category Spending Summary ─────────────────────────────────────────────

export async function getCategorySpending(): Promise<CategorySpending[]> {
  const { supabase, userId } = await requireUser();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Fetch quotas
  const { data: quotas } = await supabase
    .from("category_quotas")
    .select("*")
    .eq("user_id", userId);

  // Fetch expenses for the month
  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount, major_category")
    .eq("user_id", userId)
    .gte("expense_date", format(monthStart, "yyyy-MM-dd"))
    .lte("expense_date", format(monthEnd, "yyyy-MM-dd"));

  // Aggregate spending per major_category
  const spendingMap: Record<string, number> = {};
  for (const e of expenses ?? []) {
    const cat = e.major_category || "Daily Expense";
    spendingMap[cat] = (spendingMap[cat] ?? 0) + Number(e.amount);
  }

  // Include "Daily Expense" using the monthly budget from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("monthly_budget")
    .eq("id", userId)
    .single();

  const monthlyBudget = profile?.monthly_budget
    ? Number(profile.monthly_budget)
    : 0;

  const result: CategorySpending[] = [];

  // Add Daily Expense as the first entry (uses monthly budget as limit)
  if (monthlyBudget > 0) {
    const dailySpent = spendingMap["Daily Expense"] ?? 0;
    result.push({
      category: "Daily Expense",
      monthlyLimit: monthlyBudget,
      spent: Math.round(dailySpent * 100) / 100,
      remaining: Math.round((monthlyBudget - dailySpent) * 100) / 100,
      percentage:
        monthlyBudget > 0
          ? Math.round((dailySpent / monthlyBudget) * 10000) / 100
          : 0,
    });
  }

  // Add other category quotas
  for (const q of quotas ?? []) {
    const spent = spendingMap[q.category] ?? 0;
    const limit = q.monthly_limit != null ? Number(q.monthly_limit) : null;
    result.push({
      category: q.category,
      monthlyLimit: limit,
      spent: Math.round(spent * 100) / 100,
      remaining: limit != null ? Math.round((limit - spent) * 100) / 100 : null,
      percentage: limit != null && limit > 0 ? Math.round((spent / limit) * 10000) / 100 : 0,
    });
  }

  return result;
}

// ─── Monthly Expense Overview (for Dashboard Charts) ───────────────────────

export async function getMonthlyExpenseOverview(): Promise<MonthlyExpenseOverview> {
  const { supabase, userId } = await requireUser();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount, major_category, category, expense_date")
    .eq("user_id", userId)
    .gte("expense_date", format(monthStart, "yyyy-MM-dd"))
    .lte("expense_date", format(monthEnd, "yyyy-MM-dd"));

  const allExpenses = expenses ?? [];
  const totalSpent = allExpenses.reduce((acc, e) => acc + Number(e.amount), 0);

  // By major_category (top-level grouping)
  const catMap: Record<string, number> = {};
  for (const e of allExpenses) {
    const cat = e.major_category || "Daily Expense";
    catMap[cat] = (catMap[cat] ?? 0) + Number(e.amount);
  }
  const byCategory = Object.entries(catMap)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percentage:
        totalSpent > 0 ? Math.round((amount / totalSpent) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // By week
  const weekStartDay = 1;
  const weeks = getWeeksOfMonth(
    now.getFullYear(),
    now.getMonth(),
    weekStartDay,
  );
  const byWeek = weeks.map((w, i) => {
    const weekExpenses = allExpenses.filter((e) => {
      const d = parseISO(e.expense_date);
      return isWithinInterval(d, {
        start: startOfDay(w.start),
        end: endOfDay(w.end),
      });
    });
    const amount = weekExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
    return {
      weekLabel: `Week ${i + 1}`,
      amount: Math.round(amount * 100) / 100,
    };
  });

  return {
    totalSpent: Math.round(totalSpent * 100) / 100,
    byCategory,
    byWeek,
  };
}
