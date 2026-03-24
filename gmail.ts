import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

import { google } from 'googleapis';

// This tells dotenv to look for .env.local specifically
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Add this log to verify it's working
console.log("Checking Client ID:", process.env.GMAIL_CLIENT_ID ? "Loaded ✅" : "Missing ❌");

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/api/auth/google/callback"
);

// // 1. Generate the URL the user (you) needs to visit
// const authUrl = oauth2Client.generateAuthUrl({
//   access_type: 'offline', // Required to get a refresh token
//   prompt: 'consent',      // Forces the consent screen to ensure refresh token is sent
//   scope: ['https://www.googleapis.com/auth/gmail.send'],
// });

// console.log('Authorize this app by visiting this url:', authUrl);

async function validateConnection() {
  try {
    // 1. Set the credentials using your new Refresh Token
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    // 2. Initialize the Gmail instance
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 3. Try to fetch labels
    const response = await gmail.users.labels.list({
      userId: 'me',
    });

    const labels = response.data.labels;
    if (labels && labels.length > 0) {
      console.log("--- SUCCESS! ---");
      console.log(`Connected to: ${process.env.GMAIL_USER || 'your account'}`);
      console.log(`Found ${labels.length} labels. Connection is active.`);
    } else {
      console.log("Connected, but no labels were found.");
    }
  } catch (error: any) {
    console.error("--- CONNECTION FAILED ---");
    console.error("Status Code:", error.response?.status);
    console.error("Error Data:", error.response?.data);
  }
}

validateConnection();