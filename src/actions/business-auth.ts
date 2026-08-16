"use server";

import { createClient } from "@/lib/supabase/server";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createBusinessSession,
  setBusinessSessionCookie,
  deleteBusinessSessionCookie,
} from "@/lib/auth/business-session";
import { redirect } from "next/navigation";

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
    .select("role, businesses(id, name)")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"]);

  if (!memberships || memberships.length === 0) {
    return {
      error: "No business found for this account. Please sign up as a business owner.",
    };
  }

  // Auto-select if only one business; return list if multiple
  const businesses = memberships.map((m) => {
    const biz = (m.businesses as unknown) as { id: string; name: string };
    return { id: biz.id, name: biz.name, role: m.role as "owner" | "admin" };
  });

  if (businesses.length === 1) {
    const biz = businesses[0];
    const token = await createBusinessSession({
      userId: user.id,
      email: user.email,
      businessId: biz.id,
      businessName: biz.name,
      role: biz.role,
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
    .select("role, businesses(id, name)")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .single();

  if (!membership) {
    return { error: "Access denied to this business" };
  }

  const biz = (membership.businesses as unknown) as { id: string; name: string };
  const token = await createBusinessSession({
    userId,
    email,
    businessId: biz.id,
    businessName: biz.name,
    role: membership.role as "owner" | "admin" | "member",
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
    .select("id, name")
    .eq("invite_code", inviteCode)
    .single();

  if (bizError || !business) {
    return { error: "Invalid invite code. Please check with your business owner." };
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("business_members")
    .select("role")
    .eq("business_id", business.id)
    .eq("user_id", user.id)
    .single();

  let role: "owner" | "admin" | "member" = "member";

  if (!existing) {
    // Auto-enroll as member
    await supabase.from("business_members").insert({
      business_id: business.id,
      user_id: user.id,
      role: "member",
    });
  } else {
    role = existing.role as "owner" | "admin" | "member";
  }

  const token = await createBusinessSession({
    userId: user.id,
    email: user.email,
    businessId: business.id,
    businessName: business.name,
    role,
  });
  await setBusinessSessionCookie(token);
  redirect("/business/dashboard");
}

export async function businessLogout() {
  await deleteBusinessSessionCookie();
  redirect("/business/login");
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
