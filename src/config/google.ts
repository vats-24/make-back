import { google } from "googleapis";
import { env } from "./env";

export const scopes = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export const oauth2Client = new google.auth.OAuth2(
  env.CLIENT_ID,
  env.CLIENT_SECRET,
  env.REDIRECT_URL
);

export const calendar = google.calendar({
  version: "v3",
  auth: env.API_KEY,
});
