import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  EMAIL_TRANSPORT: z.enum(['smtp', 'resend']).default('smtp'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.string().default('1025'),
  SMTP_FROM: z.string().default('alerts@norn.local'),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().default('alerts@norn.local'),
})

export const env = envSchema.parse(process.env)
