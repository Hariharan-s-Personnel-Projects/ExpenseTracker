// @ts-nocheck
import { streamText, tool, convertToModelMessages } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionFromCookies } from "@/lib/auth/session";

export const maxDuration = 30;

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

/** Extracts plain text from any message shape useChat might send */
function extractText(message: any): string {
  if (!message) return "";
  // Plain string content (most common from useChat)
  if (typeof message.content === "string") return message.content;
  // Array of content parts  { type: "text", text: "..." }
  if (Array.isArray(message.content)) {
    return message.content
      .filter((p: any) => p?.type === "text")
      .map((p: any) => p.text ?? "")
      .join("");
  }
  // UIMessage parts format  { type: "text", text: "..." }
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((p: any) => p?.type === "text")
      .map((p: any) => p.text ?? "")
      .join("");
  }
  return "";
}

// ────────────────────────────────────────────────
// Database helper functions
// ────────────────────────────────────────────────

async function dbCreateExpense(
  supabase: any,
  userId: string,
  data: {
    amount: number;
    description: string;
    category: string;
    expense_date: string;
  },
) {
  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({ user_id: userId, ...data })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return expense;
}

async function dbGetExpenses(supabase: any, userId: string) {
  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("id, amount, description, category, expense_date")
    .eq("user_id", userId)
    .order("expense_date", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return expenses || [];
}

async function dbGetBudgetSummary(supabase: any, userId: string) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - daysSinceMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfWeekDate = startOfWeek.toISOString().split("T")[0];

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonthDate = startOfMonth.toISOString().split("T")[0];

  const [profileResult, expensesResult, monthlyExpensesResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("monthly_budget")
        .eq("id", userId)
        .single(),
      supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", userId)
        .gte("expense_date", startOfWeekDate),
      supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", userId)
        .gte("expense_date", startOfMonthDate),
    ]);

  const monthlyBudget = profileResult.data?.monthly_budget
    ? Number(profileResult.data.monthly_budget)
    : 0;
  const weeklyLimit = monthlyBudget / 4.33;

  const spentThisWeek =
    expensesResult.data?.reduce(
      (acc: number, curr: any) => acc + Number(curr.amount),
      0,
    ) || 0;

  const spentThisMonth =
    monthlyExpensesResult.data?.reduce(
      (acc: number, curr: any) => acc + Number(curr.amount),
      0,
    ) || 0;

  return {
    monthlyBudget,
    weeklyLimit,
    spentThisWeek,
    remainingThisWeek: weeklyLimit - spentThisWeek,
    spentThisMonth,
    remainingThisMonth: monthlyBudget - spentThisMonth,
  };
}

async function dbDeleteExpense(supabase: any, userId: string, id: string) {
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

async function dbGetExpensesByDateRange(
  supabase: any,
  userId: string,
  startDate: string,
  endDate: string,
) {
  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("id, amount, description, category, expense_date")
    .eq("user_id", userId)
    .gte("expense_date", startDate)
    .lte("expense_date", endDate)
    .order("expense_date", { ascending: false });

  if (error) throw new Error(error.message);
  return expenses || [];
}

async function dbSearchExpenses(supabase: any, userId: string, query: string) {
  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("id, amount, description, category, expense_date")
    .eq("user_id", userId)
    .ilike("description", `%${query}%`)
    .order("expense_date", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return expenses || [];
}

// ────────────────────────────────────────────────
// API Route
// ────────────────────────────────────────────────

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return new Response("Groq API Key not configured", { status: 500 });
  }

  try {
    const session = await getSessionFromCookies();
    if (!session?.userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabase = await createClient();
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response("No messages provided", { status: 400 });
    }

    // ✅ Save user message — handles string content, content[], and parts[]
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "user") {
      const text = extractText(lastMessage);
      if (text.trim()) {
        // Fire-and-forget but log errors so issues are visible
        supabase
          .from("ai_messages")
          .insert({
            user_id: session.userId,
            role: "user",
            message: text.trim(),
          })
          .then(({ error }: any) => {
            if (error)
              console.error("Failed to save user message:", error.message);
          });
      }
    }

    const systemPrompt = `You are an intelligent financial assistant embedded in a modern expense tracking app called Tracker AI. Speak professionally but warmly.

You have FULL ACCESS to the user's expense database through the tools provided. You MUST use these tools to answer questions — NEVER say you "need access" or "can't access" data.

TOOL USAGE RULES (follow strictly):
- To add/log an expense → call addExpense immediately. Extract amount, category, description from the message.
- To check budget, spending, remaining money, or weekly/monthly limit → call getBudgetSummary immediately.
- To list/show expenses → call getExpenses immediately.
- To delete an expense → call deleteExpense with its UUID.
- To update an expense → call updateExpense with its UUID and new values.
- To check spending by category → call getExpensesByCategory.
- To check spending in a time period ("last week", "this month") → call getExpensesByDateRange.
- To find specific purchases ("coffee", "uber") → call searchExpenses.

AFTER calling a tool, respond with a clear human-friendly summary of the data. Never just say a tool was called.
Format all currency with ₹ (Indian Rupees).
If the user is close to their weekly limit, warn them politely.
Be concise but informative.`;

    const tools = {
      addExpense: tool({
        description:
          "Log a new expense. Always use this when the user says they spent money or asks to add an expense.",
        parameters: z.object({
          amount: z.number().describe("The expense amount in Indian Rupees"),
          description: z.string().describe("What was purchased"),
          category: z
            .string()
            .describe(
              "Category: Food, Dining, Transport, Groceries, Utilities, Entertainment, Shopping, Health, or Other",
            ),
          date: z
            .string()
            .optional()
            .describe("Optional date in YYYY-MM-DD format. Defaults to today."),
        }),
        execute: async ({ amount, description, category, date }) => {
          const expDate = date || new Date().toISOString().split("T")[0];
          const expense = await dbCreateExpense(supabase, session.userId, {
            amount,
            description,
            category,
            expense_date: expDate,
          });
          return {
            success: true,
            message: `Expense of ₹${amount} for "${description}" (${category}) added on ${expDate}.`,
            expense,
          };
        },
      }),

      getExpenses: tool({
        description:
          "Get the list of recent expenses. Use when user wants to see their spending history.",
        parameters: z.object({}),
        execute: async () => {
          const expenses = await dbGetExpenses(supabase, session.userId);
          return { success: true, count: expenses.length, expenses };
        },
      }),

      getBudgetSummary: tool({
        description:
          "Get budget overview: monthly budget, weekly limit, amount spent this week, remaining this week.",
        parameters: z.object({}),
        execute: async () => {
          const summary = await dbGetBudgetSummary(supabase, session.userId);
          return { success: true, summary };
        },
      }),

      deleteExpense: tool({
        description:
          "Delete an expense by its UUID. Only use if user explicitly asks to remove a specific expense.",
        parameters: z.object({
          id: z.string().describe("UUID of the expense"),
        }),
        execute: async ({ id }) => {
          await dbDeleteExpense(supabase, session.userId, id);
          return { success: true, message: `Expense ${id} deleted.` };
        },
      }),

      updateExpense: tool({
        description: "Update an existing expense by its UUID.",
        parameters: z.object({
          id: z.string().describe("UUID of the expense to update"),
          amount: z.number().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          expense_date: z.string().optional().describe("New date YYYY-MM-DD"),
        }),
        execute: async ({ id, ...updates }) => {
          const cleanUpdates = Object.fromEntries(
            Object.entries(updates).filter(([, v]) => v !== undefined),
          );
          const { data: expense, error } = await supabase
            .from("expenses")
            .update(cleanUpdates)
            .eq("id", id)
            .eq("user_id", session.userId)
            .select()
            .single();

          if (error) throw new Error(error.message);
          return {
            success: true,
            message: `Expense ${id} updated successfully.`,
            expense,
          };
        },
      }),

      getExpensesByCategory: tool({
        description: "Get expenses filtered by a specific category.",
        parameters: z.object({
          category: z.string().describe("The category to filter by"),
        }),
        execute: async ({ category }) => {
          const { data: expenses, error } = await supabase
            .from("expenses")
            .select("id, amount, description, category, expense_date")
            .eq("user_id", session.userId)
            .ilike("category", `%${category}%`)
            .order("expense_date", { ascending: false })
            .limit(20);

          if (error) throw new Error(error.message);

          const total =
            expenses?.reduce(
              (acc: number, curr: any) => acc + Number(curr.amount),
              0,
            ) || 0;

          return {
            success: true,
            category,
            count: expenses?.length || 0,
            total,
            expenses: expenses || [],
          };
        },
      }),

      getExpensesByDateRange: tool({
        description:
          "Get expenses within a date range. Use when the user asks about spending in a specific period like 'last week', 'this month', 'in January', etc.",
        parameters: z.object({
          startDate: z.string().describe("Start date in YYYY-MM-DD format"),
          endDate: z.string().describe("End date in YYYY-MM-DD format"),
        }),
        execute: async ({ startDate, endDate }) => {
          const expenses = await dbGetExpensesByDateRange(
            supabase,
            session.userId,
            startDate,
            endDate,
          );
          const total = expenses.reduce(
            (acc: number, curr: any) => acc + Number(curr.amount),
            0,
          );
          return {
            success: true,
            startDate,
            endDate,
            count: expenses.length,
            total,
            expenses,
          };
        },
      }),

      searchExpenses: tool({
        description:
          "Search expenses by keyword in the description. Use when the user asks about specific purchases like 'how much did I spend on coffee' or 'find my uber expenses'.",
        parameters: z.object({
          query: z
            .string()
            .describe("Keyword to search in expense descriptions"),
        }),
        execute: async ({ query }) => {
          const expenses = await dbSearchExpenses(
            supabase,
            session.userId,
            query,
          );
          const total = expenses.reduce(
            (acc: number, curr: any) => acc + Number(curr.amount),
            0,
          );
          return {
            success: true,
            query,
            count: expenses.length,
            total,
            expenses,
          };
        },
      }),
    };

    const modelMessages = await convertToModelMessages(messages, { tools });

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      messages: modelMessages,
      maxSteps: 5,
      tools,
      toolChoice: "auto",
      onFinish: async ({ text, toolResults }) => {
        // ✅ Build message from AI text + any tool result messages
        let messageToSave = text?.trim() ?? "";

        if (!messageToSave && toolResults?.length) {
          // Fallback: stitch together tool result messages when text is empty
          messageToSave = toolResults
            .map((r: any) => r?.result?.message ?? "")
            .filter(Boolean)
            .join("\n\n");
        }

        if (messageToSave) {
          const { error } = await supabase.from("ai_messages").insert({
            user_id: session.userId,
            role: "assistant",
            message: messageToSave,
          });
          if (error)
            console.error("Failed to save assistant message:", error.message);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Groq API Error:", error);
    return new Response("An error occurred during your request.", {
      status: 500,
    });
  }
}
