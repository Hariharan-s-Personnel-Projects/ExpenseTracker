import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const BUSINESS_SESSION_COOKIE = 'business_session_token'
const SESSION_DURATION = 7 * 24 * 60 * 60 // 7 days

function getJwtSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export interface BusinessSessionPayload {
  userId: string
  email: string
  businessId: string
  businessName: string
  role: 'owner' | 'admin' | 'member' | 'sales'
  industry: string | null
}

export async function createBusinessSession(payload: BusinessSessionPayload): Promise<string> {
  const secret = getJwtSecret()
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(secret)
}

export async function verifyBusinessSession(token: string): Promise<BusinessSessionPayload | null> {
  try {
    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret)
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      businessId: payload.businessId as string,
      businessName: payload.businessName as string,
      role: payload.role as 'owner' | 'admin' | 'member',
      industry: (payload.industry as string) ?? null,
    }
  } catch {
    return null
  }
}

export async function setBusinessSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(BUSINESS_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  })
}

export async function deleteBusinessSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.set(BUSINESS_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

export async function getBusinessSession(): Promise<BusinessSessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(BUSINESS_SESSION_COOKIE)?.value
  if (!token) return null
  return verifyBusinessSession(token)
}

export function getBusinessSessionCookieName() {
  return BUSINESS_SESSION_COOKIE
}
