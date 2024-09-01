import zennv from "zennv";
import {z} from "zod";

export const env = zennv({
    dotenv: true,
    schema: z.object({
        PORT: z.number().default(3000),
        HOST: z.string().default("0.0.0.0"),
        DATABASE_CONNECTION: z.string(),
        ACCESS_JWT_SECRET: z.string(),
        REFRESH_JWT_SECRET: z.string(),
        ACCESS_JWT_EXPIRY: z.string(),
        REFRESH_JWT_EXPIRY: z.string(),
        CLIENT_ID: z.string(),
        CLIENT_SECRET: z.string(),
        REDIRECT_URL: z.string(),
        API_KEY: z.string(),
        JWT_SECRET: z.string(),
        JWT_EXPIRY:z.string(),
        CLOUDFLARE_ENDPOINT:z.string(),
        CLOUDFLARE_ACCESS_KEY_ID:z.string(),
        CLOUDFLARE_SECRET_ACCESS_KEY:z.string()
    }),
});