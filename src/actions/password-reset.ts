"use server";

import { createClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth/password";
import { sendPasswordResetEmail } from "@/lib/mail/gmail";
import { randomBytes, createHmac } from "crypto";

function getResetTokenExpiryMinutes(): number {
  const minutes = parseInt(process.env.RESET_TOKEN_EXPIRY_MINUTES || "5", 10);
  return isNaN(minutes) || minutes <= 0 ? 5 : minutes;
}

function hashToken(token: string): string {
  return createHmac("sha256", process.env.AUTH_SECRET!)
    .update(token)
    .digest("hex");
}

export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return { error: "Email is required" };
  }

  const supabase = await createClient();

  const { data: user } = await supabase
    .from("users")
    .select("id, email, is_google")
    .eq("email", email)
    .single();

  if (!user) {
    // Return success even if user not found to prevent email enumeration
    return { success: true };
  }

  if (user.is_google && !user.id) {
    return { success: true };
  }

  // Invalidate existing unused tokens for this user
  await supabase
    .from("password_reset_tokens")
    .update({ used: true })
    .eq("user_id", user.id)
    .eq("used", false);

  // Generate a secure random token
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  const expiryMinutes = getResetTokenExpiryMinutes();
  const expiresAt = new Date(
    Date.now() + expiryMinutes * 60 * 1000,
  ).toISOString();

  const { error: insertError } = await supabase
    .from("password_reset_tokens")
    .insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

  if (insertError) {
    console.error("Failed to insert reset token:", insertError);
    return { error: "Something went wrong. Please try again." };
  }

  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${rawToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetLink, expiryMinutes);
  } catch (err) {
    console.error("Failed to send reset email:", err);
    return { error: "Failed to send reset email. Please try again later." };
  }

  return { success: true };
}

export async function verifyResetToken(token: string) {
  if (!token) {
    return { error: "Invalid reset link" };
  }

  const tokenHash = hashToken(token);
  const supabase = await createClient();

  const { data: resetToken } = await supabase
    .from("password_reset_tokens")
    .select("id, user_id, expires_at, used")
    .eq("token_hash", tokenHash)
    .single();

  if (!resetToken) {
    return { error: "Invalid or expired reset link" };
  }

  if (resetToken.used) {
    return { error: "This reset link has already been used" };
  }

  if (new Date(resetToken.expires_at) < new Date()) {
    return { error: "This reset link has expired. Please request a new one." };
  }

  // Fetch user email for display
  const { data: user } = await supabase
    .from("users")
    .select("email")
    .eq("id", resetToken.user_id)
    .single();

  return {
    valid: true,
    email: user?.email,
    tokenId: resetToken.id,
    userId: resetToken.user_id,
  };
}

export async function resetPassword(formData: FormData) {
  const token = formData.get("token") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token) {
    return { error: "Invalid reset link" };
  }

  if (!newPassword || !confirmPassword) {
    return { error: "All fields are required" };
  }

  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  // Verify the token again
  const tokenHash = hashToken(token);
  const supabase = await createClient();

  const { data: resetToken } = await supabase
    .from("password_reset_tokens")
    .select("id, user_id, expires_at, used")
    .eq("token_hash", tokenHash)
    .single();

  if (!resetToken || resetToken.used) {
    return { error: "Invalid or already used reset link" };
  }

  if (new Date(resetToken.expires_at) < new Date()) {
    return { error: "This reset link has expired. Please request a new one." };
  }

  // Update password
  const newHash = hashPassword(newPassword);

  const { error: updateError } = await supabase
    .from("users")
    .update({ password_hash: newHash })
    .eq("id", resetToken.user_id);

  if (updateError) {
    return { error: "Failed to update password. Please try again." };
  }

  // Mark token as used
  await supabase
    .from("password_reset_tokens")
    .update({ used: true })
    .eq("id", resetToken.id);

  return { success: true };
}
