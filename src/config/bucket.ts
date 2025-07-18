import { S3Client } from "@aws-sdk/client-s3"
import { env } from "./env"

export const s3client = new S3Client({
    region: 'APAC',
    endpoint: env.CLOUDFLARE_ENDPOINT,
    credentials: {
        accessKeyId: env.CLOUDFLARE_ACCESS_KEY_ID,
        secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY
    }
}) 