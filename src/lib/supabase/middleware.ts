import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "session_token";
const BUSINESS_SESSION_COOKIE = "business_session_token";

const protectedRoutes = [
  "/dashboard",
  "/expenses",
  "/add-expense",
  "/ai-assistant",
  "/settings",
  "/income",
  "/savings",
  "/investments",
  "/lending",
  "/money-flow",
  "/budget",
];
const authRoutes = ["/login", "/signup"];

const businessProtectedRoutes = [
  "/business/dashboard",
  "/business/expenses",
  "/business/members",
  "/business/approvals",
  "/business/analytics",
  "/business/settings",
];
const businessAuthRoutes = ["/business/login", "/business/signup"];

function getJwtSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function getSessionFromCookie(token: string | undefined) {
  if (!token) return null;
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // --- Personal auth ---
  const personalToken = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await getSessionFromCookie(personalToken);

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // --- Business auth ---
  const businessToken = request.cookies.get(BUSINESS_SESSION_COOKIE)?.value;
  const businessSession = await getSessionFromCookie(businessToken);

  const isBusinessProtected = businessProtectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  if (isBusinessProtected && !businessSession) {
    const loginUrl = new URL("/business/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isBusinessAuthRoute = businessAuthRoutes.some((route) =>
    pathname.startsWith(route)
  );
  if (isBusinessAuthRoute && businessSession) {
    return NextResponse.redirect(new URL("/business/dashboard", request.url));
  }

  return NextResponse.next();
}
