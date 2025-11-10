import type { createBetterAuth } from "@/config/auth/auth";

export type Auth = ReturnType<typeof createBetterAuth>["auth"];

export type Session = Auth['$Infer']['Session']