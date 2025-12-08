/**
 * Plugin Generators Index
 *
 * Exports all plugin generators for registration with the orchestrator.
 * Generators are organized by category and loaded dynamically.
 */

// Core generators
export * from "./core/typescript.generator";
export * from "./core/eslint.generator";
export * from "./core/prettier.generator";
export * from "./core/vitest.generator";
export * from "./core/turborepo.generator";

// App generators
export * from "./app/nestjs.generator";
export * from "./app/nextjs.generator";

// Feature generators
export * from "./feature/drizzle.generator";
export * from "./feature/better-auth.generator";
export * from "./feature/orpc.generator";
export * from "./feature/zod.generator";
export * from "./feature/react-query.generator";
export * from "./feature/zustand.generator";

// Infrastructure generators
export * from "./infrastructure/docker.generator";
export * from "./infrastructure/postgresql.generator";
export * from "./infrastructure/redis.generator";
export * from "./infrastructure/github-actions.generator";

// UI generators
export * from "./ui/tailwindcss.generator";
export * from "./ui/shadcn-ui.generator";
export * from "./ui/next-themes.generator";

// Generator collection for dynamic loading
export {
  GeneratorClasses,
  GeneratorProviders,
  ALL_GENERATORS,
  AllGeneratorsProvider,
  AllProviders,
  GeneratorMetadata,
  getGeneratorByPluginId,
  getAllPluginIds,
} from "./generator-collection";
