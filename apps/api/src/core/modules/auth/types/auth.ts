import type { betterAuthFactory } from "@/config/auth/auth";

export type Auth = ReturnType<typeof betterAuthFactory>["auth"];