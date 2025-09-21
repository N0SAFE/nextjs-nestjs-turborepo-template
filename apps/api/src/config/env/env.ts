import { z } from 'zod/v4';

export const envSchema = z.object({
  // Database
  DATABASE_URL: z.url('DATABASE_URL must be a valid URL'),
  
  // API
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  
  // Authentication
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  DEV_AUTH_KEY: z.string().optional(),
  
  // Passkey
  PASSKEY_RPID: z.string().default('localhost'),
  PASSKEY_RPNAME: z.string().default('NestJS Directus Turborepo Template'),
  PASSKEY_ORIGIN: z.url().default('http://localhost:3000'),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;