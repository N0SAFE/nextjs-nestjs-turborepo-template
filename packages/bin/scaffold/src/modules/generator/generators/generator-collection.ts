/**
 * Generator Collection
 *
 * Central registry of all available generators.
 * This module provides NestJS providers for dependency injection.
 */
import type { Provider } from "@nestjs/common";

// Core generators
import {
  TurborepoGenerator,
  TypeScriptGenerator,
  ESLintGenerator,
  PrettierGenerator,
  VitestGenerator,
  BunRuntimeGenerator,
  EnvValidationGenerator,
} from "./core";

// App generators
import {
  NestJSGenerator,
  NextJSGenerator,
} from "./app";

// Feature generators
import {
  DrizzleGenerator,
  BetterAuthGenerator,
  BetterAuthAdminGenerator,
  BetterAuthOAuthGoogleGenerator,
  BetterAuthOAuthGitHubGenerator,
  BetterAuthOAuthDiscordGenerator,
  BetterAuthBearerGenerator,
  PermissionSystemGenerator,
  ApiKeyAuthGenerator,
  OrpcGenerator,
  OrpcContractsGenerator,
  OrpcStreamingGenerator,
  OrpcBetterAuthGenerator,
  ZodGenerator,
  ReactQueryGenerator,
  ZustandGenerator,
  DatabaseSeederGenerator,
  JobQueueGenerator,
  DockerComposeGenerator,
  TestingGenerator,
  ToastSonnerGenerator,
  // New architecture generators (Phase 14)
  NextjsMiddlewareGenerator,
  DebugUtilsGenerator,
  EntityHooksGenerator,
} from "./feature";

// Infrastructure generators
import {
  DockerGenerator,
  PostgresqlGenerator,
  RedisGenerator,
  GithubActionsGenerator,
  CiCdGenerator,
} from "./infrastructure";

// UI generators
import {
  TailwindcssGenerator,
  ShadcnUiGenerator,
  NextThemesGenerator,
} from "./ui";

/**
 * All available generator classes
 */
export const GeneratorClasses = [
  // Core (priority 0-10)
  BunRuntimeGenerator, // 1 - runs very early
  TurborepoGenerator,
  TypeScriptGenerator,
  EnvValidationGenerator, // 5 - after typescript
  ESLintGenerator,
  PrettierGenerator,
  VitestGenerator,

  // App (priority 20)
  NestJSGenerator,
  NextJSGenerator,

  // Feature (priority 25-30)
  ZodGenerator, // 25 - base for other features
  DrizzleGenerator, // 30
  BetterAuthGenerator, // 30
  BetterAuthAdminGenerator, // 31 - after better-auth
  BetterAuthOAuthGoogleGenerator, // 32 - after better-auth
  BetterAuthOAuthGitHubGenerator, // 33 - after better-auth
  BetterAuthOAuthDiscordGenerator, // 34 - after better-auth
  BetterAuthBearerGenerator, // 35 - after OAuth providers
  PermissionSystemGenerator, // 36 - after better-auth-bearer
  ApiKeyAuthGenerator, // 37 - after permission-system
  OrpcGenerator, // 30
  OrpcContractsGenerator, // 25 - enhanced contracts, after orpc
  OrpcStreamingGenerator, // 27 - streaming utilities, after orpc
  OrpcBetterAuthGenerator, // 28 - auth integration, after orpc + better-auth
  ReactQueryGenerator, // 30
  ZustandGenerator, // 30
  DatabaseSeederGenerator, // 31 - after drizzle
  JobQueueGenerator, // 35 - job queue with BullMQ
  DockerComposeGenerator, // 50 - infrastructure layer
  TestingGenerator, // 25 - enhanced testing infrastructure
  ToastSonnerGenerator, // 25 - toast notifications
  NextjsMiddlewareGenerator, // 30 - Next.js middleware composition
  DebugUtilsGenerator, // 25 - debug utilities
  EntityHooksGenerator, // 30 - auto-generated React Query hooks

  // Infrastructure (priority 40)
  DockerGenerator,
  PostgresqlGenerator,
  RedisGenerator,
  GithubActionsGenerator,
  CiCdGenerator, // 40 - CI/CD pipelines

  // UI (priority 50)
  TailwindcssGenerator,
  ShadcnUiGenerator,
  NextThemesGenerator,
] as const;

/**
 * Generator providers for NestJS dependency injection
 */
export const GeneratorProviders: Provider[] = GeneratorClasses.map((GeneratorClass) => ({
  provide: GeneratorClass,
  useClass: GeneratorClass,
}));

/**
 * Token for injecting all generators
 */
export const ALL_GENERATORS = Symbol("ALL_GENERATORS");

/**
 * Provider that injects all generators as an array
 */
export const AllGeneratorsProvider: Provider = {
  provide: ALL_GENERATORS,
  useFactory: (...generators: InstanceType<typeof GeneratorClasses[number]>[]) => generators,
  inject: [...GeneratorClasses],
};

/**
 * Complete list of generator providers
 */
export const AllProviders: Provider[] = [
  ...GeneratorProviders,
  AllGeneratorsProvider,
];

/**
 * Generator metadata for documentation and UI
 */
export const GeneratorMetadata = {
  core: {
    name: "Core",
    description: "Core essential project infrastructure",
    generators: ["bun-runtime", "turborepo", "typescript", "env-validation", "eslint", "prettier", "vitest"],
  },
  app: {
    name: "Applications",
    description: "Application frameworks",
    generators: ["nestjs", "nextjs"],
  },
  feature: {
    name: "Features",
    description: "Application features and integrations",
    generators: ["zod", "drizzle", "better-auth", "better-auth-admin", "better-auth-oauth-google", "better-auth-oauth-github", "better-auth-oauth-discord", "better-auth-bearer", "permission-system", "api-key-auth", "orpc", "orpc-contracts", "orpc-streaming", "orpc-better-auth", "react-query", "zustand", "database-seeder", "job-queue", "docker-compose", "testing", "toast-sonner", "nextjs-middleware", "debug-utils", "entity-hooks"],
  },
  infrastructure: {
    name: "Infrastructure",
    description: "DevOps and deployment",
    generators: ["docker", "postgresql", "redis", "github-actions", "ci-cd"],
  },
  ui: {
    name: "UI",
    description: "Styling and theming",
    generators: ["tailwindcss", "shadcn-ui", "next-themes"],
  },
} as const;

/**
 * Get generator class by plugin ID
 * Note: Requires knowing the plugin ID in advance as generator metadata
 * is instance-level and requires constructor arguments
 */
export function getGeneratorByPluginId(
  pluginId: string
): (typeof GeneratorClasses)[number] | undefined {
  // Plugin ID to generator mapping
  const pluginIdMap: Record<string, (typeof GeneratorClasses)[number]> = {
    "bun-runtime": BunRuntimeGenerator,
    turborepo: TurborepoGenerator,
    typescript: TypeScriptGenerator,
    "env-validation": EnvValidationGenerator,
    eslint: ESLintGenerator,
    prettier: PrettierGenerator,
    vitest: VitestGenerator,
    nestjs: NestJSGenerator,
    nextjs: NextJSGenerator,
    zod: ZodGenerator,
    drizzle: DrizzleGenerator,
    "better-auth": BetterAuthGenerator,
    "better-auth-admin": BetterAuthAdminGenerator,
    "better-auth-oauth-google": BetterAuthOAuthGoogleGenerator,
    "better-auth-oauth-github": BetterAuthOAuthGitHubGenerator,
    "better-auth-oauth-discord": BetterAuthOAuthDiscordGenerator,
    "better-auth-bearer": BetterAuthBearerGenerator,
    "permission-system": PermissionSystemGenerator,
    "api-key-auth": ApiKeyAuthGenerator,
    orpc: OrpcGenerator,
    "orpc-contracts": OrpcContractsGenerator,
    "orpc-streaming": OrpcStreamingGenerator,
    "orpc-better-auth": OrpcBetterAuthGenerator,
    "react-query": ReactQueryGenerator,
    zustand: ZustandGenerator,
    "database-seeder": DatabaseSeederGenerator,
    "job-queue": JobQueueGenerator,
    "docker-compose": DockerComposeGenerator,
    testing: TestingGenerator,
    "toast-sonner": ToastSonnerGenerator,
    "nextjs-middleware": NextjsMiddlewareGenerator,
    "debug-utils": DebugUtilsGenerator,
    "entity-hooks": EntityHooksGenerator,
    docker: DockerGenerator,
    postgresql: PostgresqlGenerator,
    redis: RedisGenerator,
    "github-actions": GithubActionsGenerator,
    "ci-cd": CiCdGenerator,
    tailwindcss: TailwindcssGenerator,
    "shadcn-ui": ShadcnUiGenerator,
    "next-themes": NextThemesGenerator,
  };

  return pluginIdMap[pluginId];
}

/**
 * Get all plugin IDs
 */
export function getAllPluginIds(): string[] {
  return [
    "bun-runtime",
    "turborepo",
    "typescript",
    "env-validation",
    "eslint",
    "prettier",
    "vitest",
    "nestjs",
    "nextjs",
    "zod",
    "drizzle",
    "better-auth",
    "better-auth-admin",
    "better-auth-oauth-google",
    "better-auth-oauth-github",
    "better-auth-oauth-discord",
    "better-auth-bearer",
    "permission-system",
    "api-key-auth",
    "orpc",
    "orpc-contracts",
    "orpc-streaming",
    "orpc-better-auth",
    "react-query",
    "zustand",
    "database-seeder",
    "job-queue",
    "docker-compose",
    "testing",
    "toast-sonner",
    "nextjs-middleware",
    "debug-utils",
    "entity-hooks",
    "docker",
    "postgresql",
    "redis",
    "github-actions",
    "ci-cd",
    "tailwindcss",
    "shadcn-ui",
    "next-themes",
  ];
}

// Re-export all generators for direct import
export {
  // Core
  BunRuntimeGenerator,
  TurborepoGenerator,
  TypeScriptGenerator,
  EnvValidationGenerator,
  ESLintGenerator,
  PrettierGenerator,
  VitestGenerator,
  // App
  NestJSGenerator,
  NextJSGenerator,
  // Feature
  DrizzleGenerator,
  BetterAuthGenerator,
  BetterAuthAdminGenerator,
  BetterAuthOAuthGoogleGenerator,
  BetterAuthOAuthGitHubGenerator,
  BetterAuthOAuthDiscordGenerator,
  BetterAuthBearerGenerator,
  PermissionSystemGenerator,
  ApiKeyAuthGenerator,
  OrpcGenerator,
  OrpcContractsGenerator,
  OrpcStreamingGenerator,
  OrpcBetterAuthGenerator,
  ZodGenerator,
  ReactQueryGenerator,
  ZustandGenerator,
  DatabaseSeederGenerator,
  JobQueueGenerator,
  DockerComposeGenerator,
  TestingGenerator,
  ToastSonnerGenerator,
  NextjsMiddlewareGenerator,
  DebugUtilsGenerator,
  EntityHooksGenerator,
  // Infrastructure
  DockerGenerator,
  PostgresqlGenerator,
  RedisGenerator,
  GithubActionsGenerator,
  CiCdGenerator,
  // UI
  TailwindcssGenerator,
  ShadcnUiGenerator,
  NextThemesGenerator,
};
