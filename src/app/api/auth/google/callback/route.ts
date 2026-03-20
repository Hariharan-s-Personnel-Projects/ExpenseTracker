import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { randomBytes } from "crypto";

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name?: string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const loginUrl = new URL("/login", request.url);

  if (error) {
    loginUrl.searchParams.set("error", "Google authentication was cancelled");
    return NextResponse.redirect(loginUrl);
  }

  if (!code || !state) {
    loginUrl.searchParams.set("error", "Invalid callback parameters");
    return NextResponse.redirect(loginUrl);
  }

  // Verify state to prevent CSRF
  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value;
  const intent = cookieStore.get("google_oauth_intent")?.value as
    | "login"
    | "signup"
    | undefined;
  cookieStore.set("google_oauth_state", "", { maxAge: 0, path: "/" });
  cookieStore.set("google_oauth_intent", "", { maxAge: 0, path: "/" });

  if (!storedState || storedState !== state) {
    loginUrl.searchParams.set("error", "Invalid state parameter");
    return NextResponse.redirect(loginUrl);
  }

  if (!intent || (intent !== "login" && intent !== "signup")) {
    loginUrl.searchParams.set("error", "Invalid authentication intent");
    return NextResponse.redirect(loginUrl);
  }

  // Exchange code for tokens
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    loginUrl.searchParams.set("error", "Google OAuth is not configured");
    return NextResponse.redirect(loginUrl);
  }

  let tokenData: GoogleTokenResponse;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      loginUrl.searchParams.set(
        "error",
        "Failed to exchange authorization code",
      );
      return NextResponse.redirect(loginUrl);
    }

    tokenData = await tokenRes.json();
  } catch {
    loginUrl.searchParams.set("error", "Failed to connect to Google");
    return NextResponse.redirect(loginUrl);
  }

  // Get user info from Google
  let googleUser: GoogleUserInfo;
  try {
    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );

    if (!userRes.ok) {
      loginUrl.searchParams.set("error", "Failed to get Google user info");
      return NextResponse.redirect(loginUrl);
    }

    googleUser = await userRes.json();
  } catch {
    loginUrl.searchParams.set("error", "Failed to get user info from Google");
    return NextResponse.redirect(loginUrl);
  }

  if (!googleUser.email) {
    loginUrl.searchParams.set(
      "error",
      "No email associated with this Google account",
    );
    return NextResponse.redirect(loginUrl);
  }

  const email = googleUser.email.toLowerCase();
  const supabase = await createClient();

  // Check if user exists by email (email is the unique identifier)
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", email)
    .single();

  // --- Flow 6: Google Login, no account at all ---
  if (intent === "login" && !existingUser) {
    loginUrl.searchParams.set(
      "error",
      "No account found. Please sign up first.",
    );
    return NextResponse.redirect(loginUrl);
  }

  // --- Flow 4 & 5: Google Login, account exists (any provider) ---
  if (intent === "login" && existingUser) {
    const token = await createSession({
      userId: existingUser.id,
      email: existingUser.email,
    });
    await setSessionCookie(token);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // --- Flow 3: Google Signup, no existing account ---
  if (intent === "signup" && !existingUser) {
    // Generate a random secure password (stored but never shown to user)
    const randomPassword = randomBytes(32).toString("hex");
    const passwordHash = hashPassword(randomPassword);

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({ email, password_hash: passwordHash, is_google: true })
      .select("id, email")
      .single();

    if (insertError || !newUser) {
      const signupUrl = new URL("/signup", request.url);
      signupUrl.searchParams.set(
        "error",
        `Failed to create account: ${insertError?.message || "Unknown error"}`,
      );
      return NextResponse.redirect(signupUrl);
    }

    // Create default profile
    await supabase
      .from("profiles")
      .insert({ id: newUser.id, monthly_budget: 1000, currency: "INR" });

    const token = await createSession({
      userId: newUser.id,
      email: newUser.email,
    });
    await setSessionCookie(token);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // --- Google Signup, account already exists → just log in ---
  if (intent === "signup" && existingUser) {
    const token = await createSession({
      userId: existingUser.id,
      email: existingUser.email,
    });
    await setSessionCookie(token);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Fallback (should never reach here)
  loginUrl.searchParams.set("error", "An unexpected error occurred");
  return NextResponse.redirect(loginUrl);
}
