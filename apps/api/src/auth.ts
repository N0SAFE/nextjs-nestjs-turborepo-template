import { createBetterAuth } from "./config/auth/auth";

export type Auth = ReturnType<typeof createBetterAuth>["auth"];

// Export an auth instance using the factory with config object directly
export const auth = createBetterAuth(null, {
  DEV_AUTH_KEY: process.env.DEV_AUTH_KEY,
  DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
  BASE_URL: process.env.NEXT_PUBLIC_API_URL,
  APP_URL: process.env.APP_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  TRUSTED_ORIGINS: process.env.TRUSTED_ORIGINS,
  AUTH_BASE_DOMAIN: process.env.AUTH_BASE_DOMAIN,
}).auth;
