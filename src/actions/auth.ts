"use server";

import { createClient } from "@/lib/supabase/server";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  setSessionCookie,
  deleteSessionCookie,
} from "@/lib/auth/session";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();

  // Look up user in custom users table
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, password_hash")
    .eq("email", email)
    .single();

  if (error || !user) {
    return { error: "Invalid email or password" };
  }

  // Verify password
  if (!verifyPassword(password, user.password_hash)) {
    return { error: "Invalid email or password" };
  }

  // Create session JWT and set cookie
  const token = await createSession({ userId: user.id, email: user.email });
  await setSessionCookie(token);

  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const supabase = await createClient();

  // Check if user already exists
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) {
    return { error: "An account with this email already exists" };
  }

  // Hash the password using AUTH_SECRET
  const passwordHash = hashPassword(password);

  // Insert user
  const { data: newUser, error: insertError } = await supabase
    .from("users")
    .insert({ email, password_hash: passwordHash })
    .select("id, email")
    .single();

  if (insertError || !newUser) {
    console.error("Signup insert error:", insertError);
    return {
      error: `Failed to create account: ${insertError?.message || "Unknown error"}`,
    };
  }

  // Create default profile
  await supabase
    .from("profiles")
    .insert({ id: newUser.id, monthly_budget: 1000, currency: "INR" });

  // Create session JWT and set cookie
  const token = await createSession({
    userId: newUser.id,
    email: newUser.email,
  });
  await setSessionCookie(token);

  redirect("/dashboard");
}

export async function updatePassword(formData: FormData) {
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All fields are required" };
  }

  if (newPassword.length < 6) {
    return { error: "New password must be at least 6 characters" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match" };
  }

  const { getSessionFromCookies } = await import("@/lib/auth/session");
  const session = await getSessionFromCookies();
  if (!session) {
    return { error: "You must be logged in" };
  }

  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("id, password_hash")
    .eq("id", session.userId)
    .single();

  if (error || !user) {
    return { error: "User not found" };
  }

  if (!verifyPassword(currentPassword, user.password_hash)) {
    return { error: "Current password is incorrect" };
  }

  const newHash = hashPassword(newPassword);

  const { error: updateError } = await supabase
    .from("users")
    .update({ password_hash: newHash })
    .eq("id", session.userId);

  if (updateError) {
    return { error: "Failed to update password" };
  }

  return { success: true };
}

export async function logout() {
  await deleteSessionCookie();
  redirect("/login");
}
