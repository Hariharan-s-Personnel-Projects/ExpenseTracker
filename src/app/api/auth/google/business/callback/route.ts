import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createBusinessSession, setBusinessSessionCookie } from "@/lib/auth/business-session";
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

  const loginUrl = new URL("/business/login", request.url);

  if (error) {
    loginUrl.searchParams.set("error", "Google authentication was cancelled");
    return NextResponse.redirect(loginUrl);
  }

  if (!code || !state) {
    loginUrl.searchParams.set("error", "Invalid callback parameters");
    return NextResponse.redirect(loginUrl);
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value;
  const intent = cookieStore.get("google_oauth_business_intent")?.value as
    | "login"
    | "signup"
    | undefined;
  cookieStore.set("google_oauth_state", "", { maxAge: 0, path: "/" });
  cookieStore.set("google_oauth_business_intent", "", { maxAge: 0, path: "/" });

  if (!storedState || storedState !== state) {
    loginUrl.searchParams.set("error", "Invalid state parameter");
    return NextResponse.redirect(loginUrl);
  }

  if (!intent || (intent !== "login" && intent !== "signup")) {
    loginUrl.searchParams.set("error", "Invalid authentication intent");
    return NextResponse.redirect(loginUrl);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/business/callback`;

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
      loginUrl.searchParams.set("error", "Failed to exchange authorization code");
      return NextResponse.redirect(loginUrl);
    }

    tokenData = await tokenRes.json();
  } catch {
    loginUrl.searchParams.set("error", "Failed to connect to Google");
    return NextResponse.redirect(loginUrl);
  }

  let googleUser: GoogleUserInfo;
  try {
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

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
    loginUrl.searchParams.set("error", "No email associated with this Google account");
    return NextResponse.redirect(loginUrl);
  }

  const email = googleUser.email.toLowerCase();
  const supabase = await createClient();

  const { data: existingUser } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", email)
    .single();

  // ---- Business Login ----
  if (intent === "login") {
    if (!existingUser) {
      loginUrl.searchParams.set("error", "No account found. Please sign up first.");
      return NextResponse.redirect(loginUrl);
    }

    const { data: memberships } = await supabase
      .from("business_members")
      .select("role, businesses(id, name)")
      .eq("user_id", existingUser.id)
      .in("role", ["owner", "admin"]);

    if (!memberships || memberships.length === 0) {
      loginUrl.searchParams.set(
        "error",
        "No business found. Please register a business first."
      );
      return NextResponse.redirect(loginUrl);
    }

    const businesses = memberships.map((m) => {
      const biz = m.businesses as unknown as { id: string; name: string };
      return { id: biz.id, name: biz.name, role: m.role as "owner" | "admin" };
    });

    if (businesses.length === 1) {
      const biz = businesses[0];
      const token = await createBusinessSession({
        userId: existingUser.id,
        email: existingUser.email,
        businessId: biz.id,
        businessName: biz.name,
        role: biz.role,
      });
      await setBusinessSessionCookie(token);
      return NextResponse.redirect(new URL("/business/dashboard", request.url));
    }

    // Multiple businesses — store state in a secure cookie and redirect to selection UI
    const secure = process.env.NODE_ENV === "production";
    cookieStore.set(
      "google_business_select",
      JSON.stringify({ userId: existingUser.id, email: existingUser.email, businesses }),
      { httpOnly: true, secure, sameSite: "lax", maxAge: 300, path: "/" }
    );
    return NextResponse.redirect(new URL("/business/login?googleSelect=1", request.url));
  }

  // ---- Business Signup ----
  let userId: string;
  let userEmail: string;

  if (!existingUser) {
    const randomPassword = randomBytes(32).toString("hex");
    const passwordHash = hashPassword(randomPassword);

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({ email, password_hash: passwordHash, is_google: true })
      .select("id, email")
      .single();

    if (insertError || !newUser) {
      const signupUrl = new URL("/business/signup", request.url);
      signupUrl.searchParams.set(
        "error",
        `Failed to create account: ${insertError?.message || "Unknown error"}`
      );
      return NextResponse.redirect(signupUrl);
    }

    await supabase
      .from("profiles")
      .insert({ id: newUser.id, monthly_budget: 0, currency: "INR" });

    userId = newUser.id;
    userEmail = newUser.email;
  } else {
    userId = existingUser.id;
    userEmail = existingUser.email;
  }

  // Store setup state and redirect to complete business setup
  const secure = process.env.NODE_ENV === "production";
  cookieStore.set(
    "google_business_setup",
    JSON.stringify({ userId, email: userEmail }),
    { httpOnly: true, secure, sameSite: "lax", maxAge: 600, path: "/" }
  );
  return NextResponse.redirect(new URL("/business/signup/complete", request.url));
}
