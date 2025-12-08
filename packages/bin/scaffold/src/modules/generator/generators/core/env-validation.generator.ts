/**
 * Environment Validation Generator
 *
 * Sets up type-safe environment variable validation using t3-env pattern.
 * Creates env.ts files with Zod schemas for runtime validation.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
  FileContribution,
} from "../../../../types/generator.types";

@Injectable()
export class EnvValidationGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "env-validation",
    priority: 5, // Core - runs early but after typescript
    version: "1.0.0",
    description: "Type-safe environment variable validation with t3-env",
    contributesTo: [
      "apps/*/env.ts",
      "apps/*/.env.example",
      "packages/types/src/env.ts",
    ],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];

    // Shared env types package
    files.push(
      this.file(
        "packages/types/src/env.ts",
        this.getSharedEnvTypes(context),
        { priority: 0 },
      ),
    );

    // API app env.ts
    if (this.hasPlugin(context, "nestjs")) {
      files.push(
        this.file(
          "apps/api/src/env.ts",
          this.getApiEnvConfig(context),
          { priority: 10 },
        ),
      );
      files.push(
        this.file(
          "apps/api/.env.example",
          this.getApiEnvExample(context),
          { priority: 10 },
        ),
      );
    }

    // Web app env.ts
    if (this.hasPlugin(context, "nextjs")) {
      files.push(
        this.file(
          "apps/web/env.ts",
          this.getWebEnvConfig(context),
          { priority: 10 },
        ),
      );
      files.push(
        this.file(
          "apps/web/.env.example",
          this.getWebEnvExample(context),
          { priority: 10 },
        ),
      );
    }

    return files;
  }

  protected override getDependencies(context: GeneratorContext): DependencySpec[] {
    const deps: DependencySpec[] = [];

    // t3-env packages
    if (this.hasPlugin(context, "nextjs")) {
      deps.push({
        name: "@t3-oss/env-nextjs",
        version: "^0.11.0",
        type: "prod",
        target: "web",
        pluginId: "env-validation",
      });
    }

    if (this.hasPlugin(context, "nestjs")) {
      deps.push({
        name: "@t3-oss/env-core",
        version: "^0.11.0",
        type: "prod",
        target: "api",
        pluginId: "env-validation",
      });
    }

    return deps;
  }

  /**
   * Get contributions for multi-plugin merging
   */
  getContributions(context: GeneratorContext): FileContribution[] {
    const contributions: FileContribution[] = [];

    contributions.push({
      pluginId: "env-validation",
      path: "packages/types/src/env.ts",
      content: this.getSharedEnvTypes(context),
      mergeStrategy: "replace",
      priority: 0,
    });

    if (this.hasPlugin(context, "nestjs")) {
      contributions.push({
        pluginId: "env-validation",
        path: "apps/api/src/env.ts",
        content: this.getApiEnvConfig(context),
        mergeStrategy: "replace",
        priority: 10,
      });
    }

    if (this.hasPlugin(context, "nextjs")) {
      contributions.push({
        pluginId: "env-validation",
        path: "apps/web/env.ts",
        content: this.getWebEnvConfig(context),
        mergeStrategy: "replace",
        priority: 10,
      });
    }

    return contributions;
  }

  private getSharedEnvTypes(_context: GeneratorContext): string {
    return `/**
 * Shared environment variable types
 * Used across all applications in the monorepo
 */
import { z } from "zod";

/**
 * Common environment variable schemas
 */
export const envSchemas = {
  // String that must be present
  requiredString: z.string().min(1, "Required"),
  
  // Optional string
  optionalString: z.string().optional(),
  
  // URL validation
  url: z.string().url("Must be a valid URL"),
  
  // Port number
  port: z.coerce.number().int().min(1).max(65535),
  
  // Boolean from string
  boolean: z.enum(["true", "false"]).transform((v) => v === "true"),
  
  // Node environment
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),
  
  // Database URL
  databaseUrl: z.string().url().startsWith("postgresql://", "Must be a PostgreSQL URL"),
  
  // Redis URL
  redisUrl: z.string().url().startsWith("redis://", "Must be a Redis URL").optional(),
};

/**
 * Helper to create a validated env object
 */
export function validateEnv<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  env: Record<string, string | undefined>,
): z.infer<z.ZodObject<T>> {
  const result = schema.safeParse(env);
  
  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  
  return result.data;
}
`;
  }

  private getApiEnvConfig(context: GeneratorContext): string {
    const config = context.projectConfig;
    const imports: string[] = [
      'import { createEnv } from "@t3-oss/env-core";',
      'import { z } from "zod";',
    ];

    const serverVars: string[] = [
      "    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),",
      "    PORT: z.coerce.number().default(3001),",
    ];

    // Add database if drizzle is enabled
    if (this.hasPlugin(context, "database") || this.hasPlugin(context, "drizzle")) {
      serverVars.push(
        "    DATABASE_URL: z.string().url(),",
      );
    }

    // Add Redis if enabled
    if (this.hasPlugin(context, "redis")) {
      serverVars.push(
        "    REDIS_URL: z.string().url().optional(),",
      );
    }

    // Add auth if better-auth is enabled
    if (this.hasPlugin(context, "better-auth")) {
      serverVars.push(
        "    BETTER_AUTH_SECRET: z.string().min(32),",
        "    BETTER_AUTH_URL: z.string().url().optional(),",
      );
    }

    return `${imports.join("\n")}

/**
 * Environment configuration for ${config.name} API
 * 
 * This validates environment variables at runtime and provides
 * type-safe access throughout the application.
 */
export const env = createEnv({
  server: {
${serverVars.join("\n")}
  },
  
  /**
   * Specify your client-side environment variables schema here.
   * For the API, this is typically empty.
   */
  client: {},
  
  /**
   * Destructure process.env here for validation
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,${this.hasPlugin(context, "database") || this.hasPlugin(context, "drizzle") ? "\n    DATABASE_URL: process.env.DATABASE_URL," : ""}${this.hasPlugin(context, "redis") ? "\n    REDIS_URL: process.env.REDIS_URL," : ""}${this.hasPlugin(context, "better-auth") ? "\n    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,\n    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL," : ""}
  },
  
  /**
   * Run \`build\` or \`dev\` with \`SKIP_ENV_VALIDATION\` to skip env validation.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  
  /**
   * Makes it so that empty strings are treated as undefined.
   */
  emptyStringAsUndefined: true,
});
`;
  }

  private getWebEnvConfig(context: GeneratorContext): string {
    const config = context.projectConfig;

    const serverVars: string[] = [
      "    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),",
    ];

    const clientVars: string[] = [
      "    NEXT_PUBLIC_APP_URL: z.string().url(),",
      "    NEXT_PUBLIC_API_URL: z.string().url(),",
    ];

    // Add auth if better-auth is enabled
    if (this.hasPlugin(context, "better-auth")) {
      serverVars.push(
        "    BETTER_AUTH_SECRET: z.string().min(32),",
      );
    }

    // Add analytics if enabled
    if (this.hasPlugin(context, "analytics") || this.hasPlugin(context, "analytics-posthog")) {
      clientVars.push(
        "    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),",
        "    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),",
      );
    }

    return `import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Environment configuration for ${config.name} Web
 * 
 * This validates environment variables at runtime and provides
 * type-safe access throughout the application.
 * 
 * @see https://env.t3.gg/docs/nextjs
 */
export const env = createEnv({
  /**
   * Server-side environment variables (not exposed to client)
   */
  server: {
${serverVars.join("\n")}
  },
  
  /**
   * Client-side environment variables (exposed to browser)
   * Must be prefixed with NEXT_PUBLIC_
   */
  client: {
${clientVars.join("\n")}
  },
  
  /**
   * Experimental: Type-safe runtime env for edge functions
   */
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,${this.hasPlugin(context, "analytics") || this.hasPlugin(context, "analytics-posthog") ? "\n    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,\n    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST," : ""}
  },
  
  /**
   * Run \`build\` or \`dev\` with \`SKIP_ENV_VALIDATION\` to skip env validation.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  
  /**
   * Makes it so that empty strings are treated as undefined.
   */
  emptyStringAsUndefined: true,
});
`;
  }

  private getApiEnvExample(context: GeneratorContext): string {
    const lines: string[] = [
      "# API Environment Variables",
      "# Copy this file to .env and fill in the values",
      "",
      "# Node environment",
      "NODE_ENV=development",
      "",
      "# Server port",
      "PORT=3001",
    ];

    if (this.hasPlugin(context, "database") || this.hasPlugin(context, "drizzle")) {
      lines.push(
        "",
        "# Database",
        "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mydb",
      );
    }

    if (this.hasPlugin(context, "redis")) {
      lines.push(
        "",
        "# Redis (optional)",
        "REDIS_URL=redis://localhost:6379",
      );
    }

    if (this.hasPlugin(context, "better-auth")) {
      lines.push(
        "",
        "# Better Auth",
        "BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long",
        "BETTER_AUTH_URL=http://localhost:3001",
      );
    }

    return lines.join("\n") + "\n";
  }

  private getWebEnvExample(context: GeneratorContext): string {
    const lines: string[] = [
      "# Web Environment Variables",
      "# Copy this file to .env.local and fill in the values",
      "",
      "# Node environment",
      "NODE_ENV=development",
      "",
      "# Public URLs (exposed to browser)",
      "NEXT_PUBLIC_APP_URL=http://localhost:3000",
      "NEXT_PUBLIC_API_URL=http://localhost:3001",
    ];

    if (this.hasPlugin(context, "better-auth")) {
      lines.push(
        "",
        "# Better Auth",
        "BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long",
      );
    }

    if (this.hasPlugin(context, "analytics") || this.hasPlugin(context, "analytics-posthog")) {
      lines.push(
        "",
        "# Analytics (optional)",
        "NEXT_PUBLIC_POSTHOG_KEY=",
        "NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com",
      );
    }

    return lines.join("\n") + "\n";
  }
}
