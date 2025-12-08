/**
 * Feature Generators
 *
 * Exports all feature generators that add specific functionality.
 */
export { DrizzleGenerator } from "./drizzle.generator";
export { BetterAuthGenerator } from "./better-auth.generator";
export { BetterAuthAdminGenerator } from "./better-auth-admin.generator";
export { BetterAuthOAuthGoogleGenerator } from "./better-auth-oauth-google.generator";
export { BetterAuthOAuthGitHubGenerator } from "./better-auth-oauth-github.generator";
export { BetterAuthOAuthDiscordGenerator } from "./better-auth-oauth-discord.generator";
export { BetterAuthBearerGenerator } from "./better-auth-bearer.generator";
export { PermissionSystemGenerator } from "./permission-system.generator";
export { ApiKeyAuthGenerator } from "./api-key-auth.generator";
export { OrpcGenerator } from "./orpc.generator";
export { OrpcContractsGenerator } from "./orpc-contracts.generator";
export { OrpcStreamingGenerator } from "./orpc-streaming.generator";
export { OrpcBetterAuthGenerator } from "./orpc-better-auth.generator";
export { ZodGenerator } from "./zod.generator";
export { ReactQueryGenerator } from "./react-query.generator";
export { ZustandGenerator } from "./zustand.generator";
export { DatabaseSeederGenerator } from "./database-seeder.generator";
export { JobQueueGenerator } from "./job-queue.generator";
export { DockerComposeGenerator } from "./docker-compose.generator";
export { TestingGenerator } from "./testing.generator";
export { ToastSonnerGenerator } from "./toast-sonner.generator";

// New architecture generators (Phase 14)
export { NextjsMiddlewareGenerator } from "./nextjs-middleware.generator";
export { DebugUtilsGenerator } from "./debug-utils.generator";
export { EntityHooksGenerator } from "./entity-hooks.generator";
