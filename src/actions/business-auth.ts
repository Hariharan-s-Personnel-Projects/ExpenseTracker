"use server";

import { createClient } from "@/lib/supabase/server";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createBusinessSession,
  setBusinessSessionCookie,
  deleteBusinessSessionCookie,
} from "@/lib/auth/business-session";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export async function businessOwnerSignup(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const fullName = (formData.get("fullName") as string)?.trim();
  const businessName = (formData.get("businessName") as string)?.trim();
  const industry = (formData.get("industry") as string)?.trim() || null;

  if (!email || !password || !fullName || !businessName) {
    return { error: "All required fields must be filled" };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const supabase = await createClient();

  // Check for existing user
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  let userId: string;

  if (existing) {
    // Existing user — just create a business for them
    userId = existing.id;
  } else {
    // Create new user
    const passwordHash = hashPassword(password);
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({ email, password_hash: passwordHash })
      .select("id")
      .single();

    if (userError || !newUser) {
      return { error: `Failed to create account: ${userError?.message}` };
    }

    // Default personal profile
    await supabase
      .from("profiles")
      .insert({ id: newUser.id, monthly_budget: 0, currency: "INR" });

    userId = newUser.id;
  }

  // Create the business
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .insert({ name: businessName, industry, owner_id: userId })
    .select("id, name")
    .single();

  if (bizError || !business) {
    return { error: `Failed to create business: ${bizError?.message}` };
  }

  // Add owner as business member
  await supabase.from("business_members").insert({
    business_id: business.id,
    user_id: userId,
    role: "owner",
  });

  // Seed default business categories
  const defaultCategories = [
    "Operations",
    "Marketing",
    "Travel",
    "Software & Tools",
    "Office Supplies",
    "Utilities",
    "Payroll",
    "Miscellaneous",
  ];
  await supabase.from("business_categories").insert(
    defaultCategories.map((name) => ({ business_id: business.id, name }))
  );

  const token = await createBusinessSession({
    userId,
    email,
    businessId: business.id,
    businessName: business.name,
    role: "owner",
    industry,
  });
  await setBusinessSessionCookie(token);

  redirect("/business/dashboard");
}

export async function businessOwnerLogin(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, password_hash")
    .eq("email", email)
    .single();

  if (error || !user) {
    return { error: "Account not found. Please sign up." };
  }

  if (!user.password_hash) {
    return { error: "This account uses Google sign-in. Please set a password." };
  }

  if (!verifyPassword(password, user.password_hash)) {
    return { error: "Incorrect password. Please try again." };
  }

  // Find owned businesses (role = owner or admin)
  const { data: memberships } = await supabase
    .from("business_members")
    .select("role, businesses(id, name, industry)")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"]);

  if (!memberships || memberships.length === 0) {
    return {
      error: "No business found for this account. Please sign up as a business owner.",
    };
  }

  // Auto-select if only one business; return list if multiple
  const businesses = memberships.map((m) => {
    const biz = (m.businesses as unknown) as { id: string; name: string; industry: string | null };
    return { id: biz.id, name: biz.name, role: m.role as "owner" | "admin", industry: biz.industry ?? null };
  });

  if (businesses.length === 1) {
    const biz = businesses[0];
    const token = await createBusinessSession({
      userId: user.id,
      email: user.email,
      businessId: biz.id,
      businessName: biz.name,
      role: biz.role,
      industry: biz.industry,
    });
    await setBusinessSessionCookie(token);
    redirect("/business/dashboard");
  }

  // Multiple businesses — return list for client to prompt selection
  return { businesses, userId: user.id, email: user.email };
}

export async function selectBusiness(formData: FormData) {
  const businessId = formData.get("businessId") as string;
  const userId = formData.get("userId") as string;
  const email = formData.get("email") as string;

  if (!businessId || !userId) {
    return { error: "Invalid selection" };
  }

  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("business_members")
    .select("role, businesses(id, name, industry)")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .single();

  if (!membership) {
    return { error: "Access denied to this business" };
  }

  const biz = (membership.businesses as unknown) as { id: string; name: string; industry: string | null };
  const token = await createBusinessSession({
    userId,
    email,
    businessId: biz.id,
    businessName: biz.name,
    role: membership.role as "owner" | "admin" | "member",
    industry: biz.industry ?? null,
  });
  await setBusinessSessionCookie(token);
  redirect("/business/dashboard");
}

export async function memberLogin(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const inviteCode = (formData.get("inviteCode") as string)?.trim();

  if (!email || !password || !inviteCode) {
    return { error: "Email, password and invite code are required" };
  }

  const supabase = await createClient();

  // Verify user credentials
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, password_hash")
    .eq("email", email)
    .single();

  if (error || !user) {
    return { error: "Account not found. Please contact your business owner." };
  }

  if (!user.password_hash) {
    return { error: "Please set a password first before joining a business." };
  }

  if (!verifyPassword(password, user.password_hash)) {
    return { error: "Incorrect password." };
  }

  // Find business by invite code
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("id, name, industry")
    .eq("invite_code", inviteCode)
    .single();

  if (bizError || !business) {
    return { error: "Invalid invite code. Please check with your business owner." };
  }

  // User must have been explicitly added by the owner — no auto-enroll
  const { data: membership } = await supabase
    .from("business_members")
    .select("role")
    .eq("business_id", business.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return {
      error:
        "You have not been added to this business. Ask your business owner to add your account first.",
    };
  }

  const role = membership.role as "owner" | "admin" | "member" | "sales";

  const token = await createBusinessSession({
    userId: user.id,
    email: user.email,
    businessId: business.id,
    businessName: business.name,
    role,
    industry: business.industry ?? null,
  });
  await setBusinessSessionCookie(token);
  redirect(role === "sales" ? "/business/sales" : "/business/dashboard");
}

export async function addBusinessMember(formData: FormData) {
  const { getBusinessSession } = await import("@/lib/auth/business-session");
  const session = await getBusinessSession();
  if (!session || session.role === "member" || session.role === "sales") {
    return { error: "Only owners and admins can add members" };
  }

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const initialPassword = (formData.get("initialPassword") as string) || "";
  const rawRole = (formData.get("role") as string) ?? "member";
  const memberRole = rawRole === "sales" ? "sales" : "member";

  if (!email) {
    return { error: "Email is required" };
  }

  const supabase = await createClient();

  // Look up existing user
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  let userId: string;
  let isNewUser = false;

  if (existing) {
    userId = existing.id;
  } else {
    // No account yet — create one with the supplied initial password
    if (!initialPassword || initialPassword.length < 6) {
      return {
        error:
          "No account found for that email. Provide an initial password (min 6 chars) to create their account.",
      };
    }
    const passwordHash = hashPassword(initialPassword);
    const { data: newUser, error: userErr } = await supabase
      .from("users")
      .insert({ email, password_hash: passwordHash })
      .select("id")
      .single();

    if (userErr || !newUser) {
      return { error: `Failed to create account: ${userErr?.message}` };
    }

    await supabase
      .from("profiles")
      .insert({ id: newUser.id, monthly_budget: 0, currency: "INR" });

    userId = newUser.id;
    isNewUser = true;
  }

  // Check not already a member
  const { data: alreadyMember } = await supabase
    .from("business_members")
    .select("id")
    .eq("business_id", session.businessId)
    .eq("user_id", userId)
    .single();

  if (alreadyMember) {
    return { error: "This user is already a member of this business." };
  }

  const { error: insertErr } = await supabase.from("business_members").insert({
    business_id: session.businessId,
    user_id: userId,
    role: memberRole,
  });

  if (insertErr) {
    return { error: insertErr.message };
  }

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/business/members");

  return { success: true, isNewUser };
}

export async function businessLogout() {
  await deleteBusinessSessionCookie();
  redirect("/business/login");
}

export async function loginWithGoogleBusiness(intent: "login" | "signup") {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return { error: "Google OAuth is not configured" };

  const state = randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  cookieStore.set("google_oauth_business_intent", intent, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/business/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "consent",
  });

  redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

export async function getGoogleBusinessSelect() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("google_business_select")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      userId: string;
      email: string;
      businesses: { id: string; name: string; role: "owner" | "admin" }[];
    };
  } catch {
    return null;
  }
}

export async function completeGoogleBusinessSetup(formData: FormData) {
  const businessName = (formData.get("businessName") as string)?.trim();
  const industry = (formData.get("industry") as string)?.trim() || null;

  if (!businessName) return { error: "Business name is required" };

  const cookieStore = await cookies();
  const raw = cookieStore.get("google_business_setup")?.value;
  if (!raw) return { error: "Session expired. Please try signing up again." };

  let setup: { userId: string; email: string };
  try {
    setup = JSON.parse(raw);
  } catch {
    return { error: "Invalid session. Please try again." };
  }

  cookieStore.set("google_business_setup", "", { maxAge: 0, path: "/" });

  const supabase = await createClient();

  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .insert({ name: businessName, industry, owner_id: setup.userId })
    .select("id, name, industry")
    .single();

  if (bizError || !business) {
    return { error: `Failed to create business: ${bizError?.message}` };
  }

  await supabase.from("business_members").insert({
    business_id: business.id,
    user_id: setup.userId,
    role: "owner",
  });

  const defaultCategories = [
    "Operations", "Marketing", "Travel", "Software & Tools",
    "Office Supplies", "Utilities", "Payroll", "Miscellaneous",
  ];
  await supabase.from("business_categories").insert(
    defaultCategories.map((name) => ({ business_id: business.id, name }))
  );

  const token = await createBusinessSession({
    userId: setup.userId,
    email: setup.email,
    businessId: business.id,
    businessName: business.name,
    role: "owner",
    industry: business.industry ?? null,
  });
  await setBusinessSessionCookie(token);
  redirect("/business/dashboard");
}

export async function deleteBusinessAccount(confirmedName: string) {
  const { getBusinessSession } = await import("@/lib/auth/business-session");
  const session = await getBusinessSession();
  if (!session) return { error: "You must be logged in" };
  if (session.role !== "owner") return { error: "Only the business owner can delete this account" };

  const supabase = await createClient();
  const businessId = session.businessId;

  const { data: business } = await supabase
    .from("businesses")
    .select("name")
    .eq("id", businessId)
    .single();

  if (!business) return { error: "Business not found" };
  if (business.name.trim() !== confirmedName.trim()) {
    return { error: "Business name does not match" };
  }

  const deletedAt = new Date().toISOString();

  // product_costs has no direct business_id — cascade via products
  const { data: products } = await supabase
    .from("products")
    .select("id")
    .eq("business_id", businessId);

  if (products && products.length > 0) {
    await supabase
      .from("product_costs")
      .update({ deleted_at: deletedAt })
      .in("product_id", products.map((p) => p.id));
  }

  // Soft delete all tables with a direct business_id FK
  const childTables = [
    "business_members",
    "business_expenses",
    "business_categories",
    "products",
    "product_categories",
    "product_cost_columns",
    "product_acquisitions",
    "inventory",
    "customer_segments",
    "selling_cost_columns",
    "product_selling_config",
    "selling_costs",
    "sales",
  ] as const;

  for (const table of childTables) {
    await supabase
      .from(table)
      .update({ deleted_at: deletedAt })
      .eq("business_id", businessId);
  }

  // Soft delete the root business last
  await supabase
    .from("businesses")
    .update({ deleted_at: deletedAt })
    .eq("id", businessId);

  const { deleteBusinessSessionCookie } = await import("@/lib/auth/business-session");
  await deleteBusinessSessionCookie();

  return { success: true };
}

export async function getBusinessUserAuthInfo() {
  const { getBusinessSession } = await import("@/lib/auth/business-session");
  const session = await getBusinessSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("is_google")
    .eq("id", session.userId)
    .single();

  return { isGoogle: data?.is_google ?? false };
}

export async function updateBusinessPassword(formData: FormData) {
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!newPassword || !confirmPassword) {
    return { error: "All fields are required" };
  }
  if (newPassword.length < 6) {
    return { error: "New password must be at least 6 characters" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  const { getBusinessSession } = await import("@/lib/auth/business-session");
  const session = await getBusinessSession();
  if (!session) return { error: "You must be logged in" };

  const supabase = await createClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, password_hash")
    .eq("id", session.userId)
    .single();

  if (error || !user) return { error: "User not found" };

  if (user.password_hash) {
    if (!currentPassword) return { error: "Current password is required" };
    if (!verifyPassword(currentPassword, user.password_hash)) {
      return { error: "Current password is incorrect" };
    }
  }

  const newHash = hashPassword(newPassword);
  const { error: updateError } = await supabase
    .from("users")
    .update({ password_hash: newHash })
    .eq("id", session.userId);

  if (updateError) return { error: "Failed to update password" };

  return { success: true };
}

export async function getBusinessInfo() {
  const { getBusinessSession } = await import("@/lib/auth/business-session");
  const session = await getBusinessSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select("id, name, industry, invite_code, currency, created_at")
    .eq("id", session.businessId)
    .single();

  return data ? { ...data, role: session.role, userId: session.userId } : null;
}
