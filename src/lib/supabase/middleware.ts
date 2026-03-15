import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SESSION_COOKIE = 'session_token'
const protectedRoutes = ['/dashboard', '/expenses', '/add-expense', '/ai-assistant', '/settings']
const authRoutes = ['/login', '/signup']

function getJwtSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set')
  return new TextEncoder().encode(secret)
}

async function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret)
    return { userId: payload.userId as string, email: payload.email as string }
  } catch {
    return null
  }
}

export async function updateSession(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  const pathname = request.nextUrl.pathname

  // Redirect unauthenticated users away from protected routes
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  if (isProtected && !session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages to the dashboard
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}
