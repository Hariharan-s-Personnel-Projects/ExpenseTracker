"use server"

import { createClient } from '@/lib/supabase/server'
import { getSessionFromCookies } from '@/lib/auth/session'

// Retrieve currently authenticated user context from JWT session
async function requireUser() {
  const session = await getSessionFromCookies()
  if (!session) throw new Error("Unauthorized access. Please log in.")
  const supabase = await createClient()
  return { supabase, userId: session.userId }
}

export async function getChatHistory() {
  const { supabase, userId } = await requireUser()

  const { data: messages, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return messages || []
}

export async function clearChatHistory() {
  const { supabase, userId } = await requireUser()

  const { error } = await supabase
    .from('ai_messages')
    .delete()
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return { success: true }
}
