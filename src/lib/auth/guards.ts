import { getBusinessSession, BusinessSessionPayload } from './business-session'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type BusinessRole = BusinessSessionPayload['role']
type NonSalesSession = Omit<BusinessSessionPayload, 'role'> & { role: 'owner' | 'admin' | 'member' }
type ManagementSession = Omit<BusinessSessionPayload, 'role'> & { role: 'owner' | 'admin' }

// ─── Permission predicates ────────────────────────────────────────────────────

/** True for owner or admin — can approve, reject, delete, manage members */
export function canManage(role: BusinessRole): boolean {
  return role === 'owner' || role === 'admin'
}

/** True for owner, admin, and member — sales role is read-only */
export function canWrite(role: BusinessRole): boolean {
  return role !== 'sales'
}

/** True only for the sales role */
export function isSales(role: BusinessRole): boolean {
  return role === 'sales'
}

// ─── Page guards — call in async server components ────────────────────────────

export async function requireSession(): Promise<BusinessSessionPayload> {
  const session = await getBusinessSession()
  if (!session) redirect('/business/login')

  const supabase = await createClient()
  const { data: biz } = await supabase
    .from('businesses')
    .select('deleted_at')
    .eq('id', session.businessId)
    .single()

  if (!biz || biz.deleted_at) {
    redirect('/api/business/session-expired')
  }

  return session
}

/** Redirects sales users to /business/sales */
export async function requireNonSalesSession(): Promise<NonSalesSession> {
  const session = await requireSession()
  if (isSales(session.role)) redirect('/business/sales')
  return session as NonSalesSession
}

/** Redirects non-management (member, sales) to /business/dashboard */
export async function requireManagementSession(): Promise<ManagementSession> {
  const session = await requireSession()
  if (!canManage(session.role)) redirect('/business/dashboard')
  return session as ManagementSession
}

/** Require retail industry, but allow sales role (e.g. product display page) */
export async function requireRetailAccess(): Promise<BusinessSessionPayload> {
  const session = await requireSession()
  if (session.industry !== 'Retail') redirect('/business/dashboard')
  return session
}

/** Require retail industry and non-sales role */
export async function requireRetailSession(): Promise<NonSalesSession> {
  const session = await requireNonSalesSession()
  if (session.industry !== 'Retail') redirect('/business/dashboard')
  return session
}
