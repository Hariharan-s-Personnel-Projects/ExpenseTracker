import { google } from "googleapis";

const OAuth2 = google.auth.OAuth2;

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Gmail API credentials are not configured. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN in .env",
    );
  }

  const oauth2Client = new OAuth2(
    clientId,
    clientSecret,
    "https://developers.google.com/oauthplayground",
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

function buildMimeMessage(
  to: string,
  subject: string,
  htmlBody: string,
): string {
  const senderEmail = process.env.GMAIL_SENDER_EMAIL;
  if (!senderEmail) {
    throw new Error("GMAIL_SENDER_EMAIL is not set in .env");
  }

  const messageParts = [
    `From: Tracker AI <${senderEmail}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    htmlBody,
  ];

  const message = messageParts.join("\r\n");
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendEmail(to: string, subject: string, htmlBody: string) {
  const oauth2Client = getOAuth2Client();
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const raw = buildMimeMessage(to, subject, htmlBody);

  const result = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  return result.data;
}

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
  expiryMinutes: number,
) {
  const subject = "Reset your Tracker AI password";
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #111; margin: 0;">Tracker AI</h1>
      </div>
      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px;">
        <h2 style="font-size: 20px; font-weight: 600; color: #111; margin: 0 0 12px;">Password Reset Request</h2>
        <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0 0 24px;">
          We received a request to reset your password. Click the button below to set a new password. 
          This link will expire in <strong>${expiryMinutes} minutes</strong>.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetLink}" 
             style="display: inline-block; background: #111; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 8px;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 12px; color: #9ca3af; line-height: 1.5; margin: 24px 0 0;">
          If you didn't request a password reset, you can safely ignore this email. 
          Your password will not be changed.
        </p>
      </div>
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 24px;">
        &copy; ${new Date().getFullYear()} Tracker AI. All rights reserved.
      </p>
    </div>
  `;

  return sendEmail(to, subject, html);
}
