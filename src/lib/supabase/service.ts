import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cookie-free Supabase client for server-side public pages (no session required).
// Works because this app uses custom JWT auth, not Supabase auth, so RLS is not
// enforced via auth.uid(). Prefer the service role key when available for bypass.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase credentials')
  return createSupabaseClient(url, key)
}
