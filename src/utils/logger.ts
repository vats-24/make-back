import pino from "pino";

export const logger = pino({
  redact: [
    "DATABASE_CONNECTION",
    "JWT_SECRET",
    "ACCESS_JWT_SECRET",
    "REFRESH_JWT_SECRET",
    "ACCESS_JWT_EXPIRY",
    "REFRESH_JWT_EXPIRY",
    "CLIENT_ID",
    "CLIENT_SECRET",
    "REDIRECT_URL",
    "API_KEY",
    "JWT_SECRET",
    "JWT_EXPIRY",
    "CLOUDFLARE_ENDPOINT",
    "CLOUDFLARE_ACCESS_KEY_ID",
    "CLOUDFLARE_SECRET_ACCESS_KEY",
  ],
  level: "debug",
  transport: {
    target: "pino-pretty",
  },
});
