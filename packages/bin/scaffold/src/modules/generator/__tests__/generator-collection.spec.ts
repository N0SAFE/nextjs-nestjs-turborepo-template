/**
 * Generator Collection Tests
 *
 * Tests for the generator collection module that provides
 * NestJS dependency injection integration for all generators.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  GeneratorClasses,
  GeneratorProviders,
  ALL_GENERATORS,
  GeneratorMetadata,
  getGeneratorByPluginId,
  getAllPluginIds,
} from "../generators/generator-collection";

// Import individual generators for type checking
import { TurborepoGenerator } from "../generators/core/turborepo.generator";
import { TypeScriptGenerator } from "../generators/core/typescript.generator";
import { ESLintGenerator } from "../generators/core/eslint.generator";
import { PrettierGenerator } from "../generators/core/prettier.generator";
import { VitestGenerator } from "../generators/core/vitest.generator";
import { BunRuntimeGenerator } from "../generators/core/bun-runtime.generator";
import { EnvValidationGenerator } from "../generators/core/env-validation.generator";
import { NestJSGenerator } from "../generators/app/nestjs.generator";
import { NextJSGenerator } from "../generators/app/nextjs.generator";
import { ZodGenerator } from "../generators/feature/zod.generator";
import { DrizzleGenerator } from "../generators/feature/drizzle.generator";
import { BetterAuthGenerator } from "../generators/feature/better-auth.generator";
import { BetterAuthAdminGenerator } from "../generators/feature/better-auth-admin.generator";
import { BetterAuthOAuthGoogleGenerator } from "../generators/feature/better-auth-oauth-google.generator";
import { BetterAuthOAuthGitHubGenerator } from "../generators/feature/better-auth-oauth-github.generator";
import { BetterAuthOAuthDiscordGenerator } from "../generators/feature/better-auth-oauth-discord.generator";
import { BetterAuthBearerGenerator } from "../generators/feature/better-auth-bearer.generator";
import { PermissionSystemGenerator } from "../generators/feature/permission-system.generator";
import { ApiKeyAuthGenerator } from "../generators/feature/api-key-auth.generator";
import { OrpcGenerator } from "../generators/feature/orpc.generator";
import { OrpcContractsGenerator } from "../generators/feature/orpc-contracts.generator";
import { OrpcStreamingGenerator } from "../generators/feature/orpc-streaming.generator";
import { OrpcBetterAuthGenerator } from "../generators/feature/orpc-better-auth.generator";
import { ReactQueryGenerator } from "../generators/feature/react-query.generator";
import { ZustandGenerator } from "../generators/feature/zustand.generator";
import { DatabaseSeederGenerator } from "../generators/feature/database-seeder.generator";
import { JobQueueGenerator } from "../generators/feature/job-queue.generator";
import { DockerComposeGenerator } from "../generators/feature/docker-compose.generator";
import { TestingGenerator } from "../generators/feature/testing.generator";
import { ToastSonnerGenerator } from "../generators/feature/toast-sonner.generator";
import { NextjsMiddlewareGenerator } from "../generators/feature/nextjs-middleware.generator";
import { DebugUtilsGenerator } from "../generators/feature/debug-utils.generator";
import { EntityHooksGenerator } from "../generators/feature/entity-hooks.generator";
import { DockerGenerator } from "../generators/infrastructure/docker.generator";
import { PostgresqlGenerator } from "../generators/infrastructure/postgresql.generator";
import { RedisGenerator } from "../generators/infrastructure/redis.generator";
import { GithubActionsGenerator } from "../generators/infrastructure/github-actions.generator";
import { CiCdGenerator } from "../generators/infrastructure/ci-cd.generator";
import { TailwindcssGenerator } from "../generators/ui/tailwindcss.generator";
import { ShadcnUiGenerator } from "../generators/ui/shadcn-ui.generator";
import { NextThemesGenerator } from "../generators/ui/next-themes.generator";

describe("GeneratorCollection", () => {
  describe("GeneratorClasses", () => {
    it("should contain all 41 generator classes", () => {
      expect(GeneratorClasses).toHaveLength(41);
    });

    it("should include all core generators", () => {
      expect(GeneratorClasses).toContain(BunRuntimeGenerator);
      expect(GeneratorClasses).toContain(TurborepoGenerator);
      expect(GeneratorClasses).toContain(TypeScriptGenerator);
      expect(GeneratorClasses).toContain(EnvValidationGenerator);
      expect(GeneratorClasses).toContain(ESLintGenerator);
      expect(GeneratorClasses).toContain(PrettierGenerator);
      expect(GeneratorClasses).toContain(VitestGenerator);
    });

    it("should include all app generators", () => {
      expect(GeneratorClasses).toContain(NestJSGenerator);
      expect(GeneratorClasses).toContain(NextJSGenerator);
    });

    it("should include all feature generators", () => {
      expect(GeneratorClasses).toContain(ZodGenerator);
      expect(GeneratorClasses).toContain(DrizzleGenerator);
      expect(GeneratorClasses).toContain(BetterAuthGenerator);
      expect(GeneratorClasses).toContain(BetterAuthAdminGenerator);
      expect(GeneratorClasses).toContain(BetterAuthOAuthGoogleGenerator);
      expect(GeneratorClasses).toContain(BetterAuthOAuthGitHubGenerator);
      expect(GeneratorClasses).toContain(BetterAuthOAuthDiscordGenerator);
      expect(GeneratorClasses).toContain(BetterAuthBearerGenerator);
      expect(GeneratorClasses).toContain(PermissionSystemGenerator);
      expect(GeneratorClasses).toContain(ApiKeyAuthGenerator);
      expect(GeneratorClasses).toContain(OrpcGenerator);
      expect(GeneratorClasses).toContain(OrpcContractsGenerator);
      expect(GeneratorClasses).toContain(OrpcStreamingGenerator);
      expect(GeneratorClasses).toContain(OrpcBetterAuthGenerator);
      expect(GeneratorClasses).toContain(ReactQueryGenerator);
      expect(GeneratorClasses).toContain(ZustandGenerator);
      expect(GeneratorClasses).toContain(DatabaseSeederGenerator);
      expect(GeneratorClasses).toContain(JobQueueGenerator);
      expect(GeneratorClasses).toContain(DockerComposeGenerator);
      expect(GeneratorClasses).toContain(TestingGenerator);
      expect(GeneratorClasses).toContain(ToastSonnerGenerator);
      expect(GeneratorClasses).toContain(NextjsMiddlewareGenerator);
      expect(GeneratorClasses).toContain(DebugUtilsGenerator);
      expect(GeneratorClasses).toContain(EntityHooksGenerator);
    });

    it("should include all infrastructure generators", () => {
      expect(GeneratorClasses).toContain(DockerGenerator);
      expect(GeneratorClasses).toContain(PostgresqlGenerator);
      expect(GeneratorClasses).toContain(RedisGenerator);
      expect(GeneratorClasses).toContain(GithubActionsGenerator);
      expect(GeneratorClasses).toContain(CiCdGenerator);
    });

    it("should include all UI generators", () => {
      expect(GeneratorClasses).toContain(TailwindcssGenerator);
      expect(GeneratorClasses).toContain(ShadcnUiGenerator);
      expect(GeneratorClasses).toContain(NextThemesGenerator);
    });
  });

  describe("GeneratorProviders", () => {
    it("should provide all generator classes as providers", () => {
      expect(GeneratorProviders).toHaveLength(41);
      GeneratorClasses.forEach((generatorClass) => {
        const hasProvider = GeneratorProviders.some(
          (provider: any) => provider.provide === generatorClass && provider.useClass === generatorClass
        );
        expect(hasProvider).toBe(true);
      });
    });
  });

  describe("ALL_GENERATORS token", () => {
    it("should be a symbol", () => {
      expect(typeof ALL_GENERATORS).toBe("symbol");
    });

    it("should have descriptive name", () => {
      expect(ALL_GENERATORS.toString()).toBe("Symbol(ALL_GENERATORS)");
    });
  });

  describe("GeneratorMetadata", () => {
    it("should contain metadata for all categories", () => {
      expect(GeneratorMetadata).toHaveProperty("core");
      expect(GeneratorMetadata).toHaveProperty("app");
      expect(GeneratorMetadata).toHaveProperty("feature");
      expect(GeneratorMetadata).toHaveProperty("infrastructure");
      expect(GeneratorMetadata).toHaveProperty("ui");
    });

    it("should have core generators in metadata", () => {
      expect(GeneratorMetadata.core.generators).toContain("bun-runtime");
      expect(GeneratorMetadata.core.generators).toContain("turborepo");
      expect(GeneratorMetadata.core.generators).toContain("typescript");
      expect(GeneratorMetadata.core.generators).toContain("env-validation");
      expect(GeneratorMetadata.core.generators).toContain("eslint");
      expect(GeneratorMetadata.core.generators).toContain("prettier");
      expect(GeneratorMetadata.core.generators).toContain("vitest");
    });

    it("should have app generators in metadata", () => {
      expect(GeneratorMetadata.app.generators).toContain("nestjs");
      expect(GeneratorMetadata.app.generators).toContain("nextjs");
    });

    it("should have feature generators in metadata", () => {
      expect(GeneratorMetadata.feature.generators).toContain("zod");
      expect(GeneratorMetadata.feature.generators).toContain("drizzle");
      expect(GeneratorMetadata.feature.generators).toContain("better-auth");
      expect(GeneratorMetadata.feature.generators).toContain("better-auth-admin");
      expect(GeneratorMetadata.feature.generators).toContain("better-auth-oauth-google");
      expect(GeneratorMetadata.feature.generators).toContain("better-auth-oauth-github");
      expect(GeneratorMetadata.feature.generators).toContain("better-auth-oauth-discord");
      expect(GeneratorMetadata.feature.generators).toContain("better-auth-bearer");
      expect(GeneratorMetadata.feature.generators).toContain("permission-system");
      expect(GeneratorMetadata.feature.generators).toContain("api-key-auth");
      expect(GeneratorMetadata.feature.generators).toContain("orpc");
      expect(GeneratorMetadata.feature.generators).toContain("orpc-contracts");
      expect(GeneratorMetadata.feature.generators).toContain("orpc-streaming");
      expect(GeneratorMetadata.feature.generators).toContain("orpc-better-auth");
      expect(GeneratorMetadata.feature.generators).toContain("react-query");
      expect(GeneratorMetadata.feature.generators).toContain("zustand");
      expect(GeneratorMetadata.feature.generators).toContain("database-seeder");
      expect(GeneratorMetadata.feature.generators).toContain("job-queue");
      expect(GeneratorMetadata.feature.generators).toContain("docker-compose");
      expect(GeneratorMetadata.feature.generators).toContain("testing");
      expect(GeneratorMetadata.feature.generators).toContain("toast-sonner");
      expect(GeneratorMetadata.feature.generators).toContain("nextjs-middleware");
      expect(GeneratorMetadata.feature.generators).toContain("debug-utils");
      expect(GeneratorMetadata.feature.generators).toContain("entity-hooks");
    });

    it("should have infrastructure generators in metadata", () => {
      expect(GeneratorMetadata.infrastructure.generators).toContain("docker");
      expect(GeneratorMetadata.infrastructure.generators).toContain("postgresql");
      expect(GeneratorMetadata.infrastructure.generators).toContain("redis");
      expect(GeneratorMetadata.infrastructure.generators).toContain("github-actions");
      expect(GeneratorMetadata.infrastructure.generators).toContain("ci-cd");
    });

    it("should have UI generators in metadata", () => {
      expect(GeneratorMetadata.ui.generators).toContain("tailwindcss");
      expect(GeneratorMetadata.ui.generators).toContain("shadcn-ui");
      expect(GeneratorMetadata.ui.generators).toContain("next-themes");
    });

    it("should have correct descriptions", () => {
      expect(GeneratorMetadata.core.description).toContain("Core");
      expect(GeneratorMetadata.app.description).toContain("Application");
      expect(GeneratorMetadata.feature.description).toContain("features");
      expect(GeneratorMetadata.infrastructure.description).toContain("DevOps");
      expect(GeneratorMetadata.ui.description).toContain("Styling");
    });
  });

  describe("getGeneratorByPluginId()", () => {
    it("should return correct generator class for each plugin ID", () => {
      // Core
      expect(getGeneratorByPluginId("bun-runtime")).toBe(BunRuntimeGenerator);
      expect(getGeneratorByPluginId("turborepo")).toBe(TurborepoGenerator);
      expect(getGeneratorByPluginId("typescript")).toBe(TypeScriptGenerator);
      expect(getGeneratorByPluginId("env-validation")).toBe(EnvValidationGenerator);
      expect(getGeneratorByPluginId("eslint")).toBe(ESLintGenerator);
      expect(getGeneratorByPluginId("prettier")).toBe(PrettierGenerator);
      expect(getGeneratorByPluginId("vitest")).toBe(VitestGenerator);

      // App
      expect(getGeneratorByPluginId("nestjs")).toBe(NestJSGenerator);
      expect(getGeneratorByPluginId("nextjs")).toBe(NextJSGenerator);

      // Feature
      expect(getGeneratorByPluginId("zod")).toBe(ZodGenerator);
      expect(getGeneratorByPluginId("drizzle")).toBe(DrizzleGenerator);
      expect(getGeneratorByPluginId("better-auth")).toBe(BetterAuthGenerator);
      expect(getGeneratorByPluginId("better-auth-admin")).toBe(BetterAuthAdminGenerator);
      expect(getGeneratorByPluginId("better-auth-oauth-google")).toBe(BetterAuthOAuthGoogleGenerator);
      expect(getGeneratorByPluginId("better-auth-oauth-github")).toBe(BetterAuthOAuthGitHubGenerator);
      expect(getGeneratorByPluginId("better-auth-oauth-discord")).toBe(BetterAuthOAuthDiscordGenerator);
      expect(getGeneratorByPluginId("better-auth-bearer")).toBe(BetterAuthBearerGenerator);
      expect(getGeneratorByPluginId("permission-system")).toBe(PermissionSystemGenerator);
      expect(getGeneratorByPluginId("api-key-auth")).toBe(ApiKeyAuthGenerator);
      expect(getGeneratorByPluginId("orpc")).toBe(OrpcGenerator);
      expect(getGeneratorByPluginId("orpc-contracts")).toBe(OrpcContractsGenerator);
      expect(getGeneratorByPluginId("orpc-streaming")).toBe(OrpcStreamingGenerator);
      expect(getGeneratorByPluginId("orpc-better-auth")).toBe(OrpcBetterAuthGenerator);
      expect(getGeneratorByPluginId("react-query")).toBe(ReactQueryGenerator);
      expect(getGeneratorByPluginId("zustand")).toBe(ZustandGenerator);
      expect(getGeneratorByPluginId("database-seeder")).toBe(DatabaseSeederGenerator);
      expect(getGeneratorByPluginId("job-queue")).toBe(JobQueueGenerator);
      expect(getGeneratorByPluginId("docker-compose")).toBe(DockerComposeGenerator);
      expect(getGeneratorByPluginId("testing")).toBe(TestingGenerator);
      expect(getGeneratorByPluginId("toast-sonner")).toBe(ToastSonnerGenerator);
      expect(getGeneratorByPluginId("nextjs-middleware")).toBe(NextjsMiddlewareGenerator);
      expect(getGeneratorByPluginId("debug-utils")).toBe(DebugUtilsGenerator);
      expect(getGeneratorByPluginId("entity-hooks")).toBe(EntityHooksGenerator);

      // Infrastructure
      expect(getGeneratorByPluginId("docker")).toBe(DockerGenerator);
      expect(getGeneratorByPluginId("postgresql")).toBe(PostgresqlGenerator);
      expect(getGeneratorByPluginId("redis")).toBe(RedisGenerator);
      expect(getGeneratorByPluginId("github-actions")).toBe(GithubActionsGenerator);
      expect(getGeneratorByPluginId("ci-cd")).toBe(CiCdGenerator);

      // UI
      expect(getGeneratorByPluginId("tailwindcss")).toBe(TailwindcssGenerator);
      expect(getGeneratorByPluginId("shadcn-ui")).toBe(ShadcnUiGenerator);
      expect(getGeneratorByPluginId("next-themes")).toBe(NextThemesGenerator);
    });

    it("should return undefined for unknown plugin ID", () => {
      expect(getGeneratorByPluginId("unknown")).toBeUndefined();
      expect(getGeneratorByPluginId("")).toBeUndefined();
      expect(getGeneratorByPluginId("nonexistent")).toBeUndefined();
    });
  });

  describe("getAllPluginIds()", () => {
    it("should return array of all 41 plugin IDs", () => {
      const ids = getAllPluginIds();
      expect(ids).toHaveLength(41);
    });

    it("should contain all expected plugin IDs", () => {
      const ids = getAllPluginIds();
      const expectedIds = [
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

      expectedIds.forEach((id) => {
        expect(ids).toContain(id);
      });
    });

    it("should return strings only", () => {
      const ids = getAllPluginIds();
      ids.forEach((id) => {
        expect(typeof id).toBe("string");
        expect(id.length).toBeGreaterThan(0);
      });
    });
  });
});
