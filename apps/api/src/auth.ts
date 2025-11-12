import { createBetterAuth } from "./config/auth/auth";

export type Auth = ReturnType<typeof createBetterAuth>["auth"];

// Export an auth instance using the factory with config object directly
export const auth = createBetterAuth(null, {
  DEV_AUTH_KEY: process.env.DEV_AUTH_KEY,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PASSKEY_ORIGIN: process.env.PASSKEY_ORIGIN ?? '',
  PASSKEY_RPID: process.env.PASSKEY_RPID ?? '',
  PASSKEY_RPNAME: process.env.PASSKEY_RPNAME ?? '',
}).auth;
