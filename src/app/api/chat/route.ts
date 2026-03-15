// @ts-nocheck
import { streamText, tool } from 'ai'
import { openai as openaiModel } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getSessionFromCookies } from '@/lib/auth/session'

export const maxDuration = 30

// Direct Supabase operations for the authenticated user (bypasses Server Action cookie issues in Route Handlers)
async function dbCreateExpense(supabase: any, userId: string, data: { amount: number, description: string, category: string, expense_date: string }) {
  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({ user_id: userId, ...data })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return expense
}

async function dbGetExpenses(supabase: any, userId: string) {
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('expense_date', { ascending: false })
    .limit(20)
  if (error) throw new Error(error.message)
  return expenses || []
}

async function dbGetBudgetSummary(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('monthly_budget')
    .eq('id', userId)
    .single()

  const monthlyBudget = profile?.monthly_budget ? Number(profile.monthly_budget) : 0
  const weeklyLimit = monthlyBudget / 4.33

  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - daysSinceMonday)
  startOfWeek.setHours(0, 0, 0, 0)

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('user_id', userId)
    .gte('expense_date', startOfWeek.toISOString())

  const spentThisWeek = expenses?.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0) || 0
  return { monthlyBudget, weeklyLimit, spentThisWeek, remainingThisWeek: weeklyLimit - spentThisWeek }
}

async function dbDeleteExpense(supabase: any, userId: string, id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response('OpenAI API Key not configured', { status: 500 })
  }

  try {
    const session = await getSessionFromCookies()
    if (!session) {
      return new Response('Unauthorized', { status: 401 })
    }

    const supabase = await createClient()
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]

    if (lastMessage && lastMessage.role === 'user') {
      await supabase.from('ai_messages').insert({
        user_id: session.userId,
        role: 'user',
        message: lastMessage.content
      })
    }

    const systemPrompt = `You are an intelligent financial assistant embedded in a modern expense tracking app called Tracker AI. Speak professionally but warmly.

CRITICAL RULES:
- When a user asks to add/log an expense, ALWAYS use the addExpense tool. Extract amount, category, and description from their message.
- When a user asks about their budget, remaining money, or weekly limit, use getBudgetSummary.
- When a user asks to see, list, or show their expenses, use getExpenses.
- When a user asks to delete an expense, use deleteExpense.
- After executing any tool, ALWAYS respond with a clear confirmation message describing what happened.
- Format currency with € symbols.
- If a user is close to their weekly limit, warn them politely.
- Be concise and helpful.

Examples of how to parse user messages:
- "add 20 to my expenses with category as food and description as dinner" → addExpense(amount: 20, category: "Food", description: "dinner")
- "I spent 15 on coffee" → addExpense(amount: 15, category: "Dining", description: "coffee")  
- "how much can I spend this week?" → getBudgetSummary()
- "show my expenses" → getExpenses()
`

    const result = streamText({
      model: openaiModel('gpt-4o-mini'),
      system: systemPrompt,
      messages,
      maxSteps: 3, // Allow model to respond AFTER tool execution
      tools: {
        addExpense: tool({
          description: 'Log a new expense. Always use this when the user says they spent money or asks to add an expense.',
          parameters: z.object({
            amount: z.number().describe('The expense amount in Euros'),
            description: z.string().describe('What was purchased'),
            category: z.string().describe('Category: Food, Dining, Transport, Groceries, Utilities, Entertainment, Shopping, Health, or Other'),
            date: z.string().optional().describe('Optional date in YYYY-MM-DD format. Defaults to today.')
          }),
          execute: async ({ amount, description, category, date }) => {
            const expDate = date || new Date().toISOString().split('T')[0]
            const expense = await dbCreateExpense(supabase, session.userId, { amount, description, category, expense_date: expDate })
            return { success: true, message: `Expense of €${amount} for "${description}" (${category}) added on ${expDate}.`, expense }
          }
        }),
        getExpenses: tool({
          description: 'Get the list of recent expenses. Use when user wants to see their spending history.',
          parameters: z.object({}),
          execute: async () => {
            const expenses = await dbGetExpenses(supabase, session.userId)
            return { success: true, count: expenses.length, expenses }
          }
        }),
        getBudgetSummary: tool({
          description: 'Get budget overview: monthly budget, weekly limit, amount spent this week, remaining this week.',
          parameters: z.object({}),
          execute: async () => {
            const summary = await dbGetBudgetSummary(supabase, session.userId)
            return { success: true, summary }
          }
        }),
        deleteExpense: tool({
          description: 'Delete an expense by its UUID. Only use if user explicitly asks to remove a specific expense.',
          parameters: z.object({
            id: z.string().describe('UUID of the expense')
          }),
          execute: async ({ id }) => {
            await dbDeleteExpense(supabase, session.userId, id)
            return { success: true, message: `Expense ${id} deleted.` }
          }
        })
      },
      onFinish: async ({ text }) => {
        if (text) {
          await supabase.from('ai_messages').insert({
            user_id: session.userId,
            role: 'assistant',
            message: text
          })
        }
      }
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('OpenAI API Error:', error)
    return new Response('An error occurred during your request.', { status: 500 })
  }
}
