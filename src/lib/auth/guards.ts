import { getBusinessSession, BusinessSessionPayload } from './business-session'
import { redirect } from 'next/navigation'

export type BusinessRole = BusinessSessionPayload['role']

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
  return session
}

/** Redirects sales users to /business/sales */
export async function requireNonSalesSession(): Promise<BusinessSessionPayload> {
  const session = await requireSession()
  if (isSales(session.role)) redirect('/business/sales')
  return session
}

/** Redirects non-management (member, sales) to /business/dashboard */
export async function requireManagementSession(): Promise<BusinessSessionPayload> {
  const session = await requireSession()
  if (!canManage(session.role)) redirect('/business/dashboard')
  return session
}

/** Require retail industry, but allow sales role (e.g. product display page) */
export async function requireRetailAccess(): Promise<BusinessSessionPayload> {
  const session = await requireSession()
  if (session.industry !== 'Retail') redirect('/business/dashboard')
  return session
}

/** Require retail industry and non-sales role */
export async function requireRetailSession(): Promise<BusinessSessionPayload> {
  const session = await requireNonSalesSession()
  if (session.industry !== 'Retail') redirect('/business/dashboard')
  return session
}
