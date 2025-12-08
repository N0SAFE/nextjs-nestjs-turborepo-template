/**
 * Zod Generator
 *
 * Sets up Zod validation schemas and utility functions.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
} from "../../../../types/generator.types";

@Injectable()
export class ZodGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "zod",
    priority: 25,
    version: "1.0.0",
    description: "Type-safe schema validation with Zod",
    dependencies: ["typescript"],
    contributesTo: ["package.json"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];

    // Add validation utilities
    files.push(
      this.file("packages/types/src/validation/index.ts", this.getValidationUtils()),
      this.file("packages/types/src/validation/helpers.ts", this.getValidationHelpers()),
      this.file("packages/types/src/validation/schemas.ts", this.getCommonSchemas()),
    );

    // Add environment validation
    if (this.hasPlugin(context, "nextjs")) {
      files.push(
        this.file("apps/web/src/lib/env.ts", this.getEnvValidation(context, "web")),
      );
    }

    if (this.hasPlugin(context, "nestjs")) {
      files.push(
        this.file("apps/api/src/config/env.validation.ts", this.getEnvValidation(context, "api")),
      );
    }

    return files;
  }

  protected override getDependencies(context: GeneratorContext): DependencySpec[] {
    const deps: DependencySpec[] = [
      { name: "zod", version: "^3.23.0", type: "prod", target: "packages/types", pluginId: "zod" },
    ];

    if (this.hasPlugin(context, "nextjs")) {
      deps.push(
        { name: "zod", version: "^3.23.0", type: "prod", target: "apps/web", pluginId: "zod" },
      );
    }

    if (this.hasPlugin(context, "nestjs")) {
      deps.push(
        { name: "zod", version: "^3.23.0", type: "prod", target: "apps/api", pluginId: "zod" },
      );
    }

    return deps;
  }

  private getValidationUtils(): string {
    return `/**
 * Validation utilities using Zod
 */
export * from "./helpers";
export * from "./schemas";
`;
  }

  private getValidationHelpers(): string {
    return `import { z } from "zod";

/**
 * Validation helper functions
 */

/**
 * Create a validated parser that throws on error
 */
export function createParser<T extends z.ZodType>(schema: T) {
  return (data: unknown): z.infer<T> => {
    return schema.parse(data);
  };
}

/**
 * Create a safe parser that returns a result object
 */
export function createSafeParser<T extends z.ZodType>(schema: T) {
  return (data: unknown): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } => {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
  };
}

/**
 * Format Zod errors to a readable object
 */
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }
  
  return formatted;
}

/**
 * Merge multiple schemas
 */
export function mergeSchemas<T extends z.ZodRawShape, U extends z.ZodRawShape>(
  schema1: z.ZodObject<T>,
  schema2: z.ZodObject<U>
): z.ZodObject<T & U> {
  return schema1.merge(schema2);
}

/**
 * Create a schema with default values
 */
export function withDefaults<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  defaults: Partial<z.infer<z.ZodObject<T>>>
): z.ZodObject<T> {
  const shape = schema.shape as Record<string, z.ZodType>;
  const newShape: Record<string, z.ZodType> = {};
  
  for (const [key, value] of Object.entries(shape)) {
    if (key in defaults) {
      newShape[key] = value.default(defaults[key as keyof typeof defaults]);
    } else {
      newShape[key] = value;
    }
  }
  
  return z.object(newShape) as z.ZodObject<T>;
}

/**
 * Create a nullable version of a schema
 */
export function nullable<T extends z.ZodType>(schema: T): z.ZodNullable<T> {
  return schema.nullable();
}

/**
 * Validate form data
 */
export function validateFormData<T extends z.ZodType>(
  schema: T,
  formData: FormData
): z.SafeParseReturnType<unknown, z.infer<T>> {
  const data: Record<string, unknown> = {};
  
  formData.forEach((value, key) => {
    // Handle multiple values for same key
    if (data[key] !== undefined) {
      if (Array.isArray(data[key])) {
        (data[key] as unknown[]).push(value);
      } else {
        data[key] = [data[key], value];
      }
    } else {
      data[key] = value;
    }
  });
  
  return schema.safeParse(data);
}
`;
  }

  private getCommonSchemas(): string {
    return `import { z } from "zod";

/**
 * Common Zod schemas for reuse across the application
 */

// String schemas
export const nonEmptyString = z.string().min(1, "Cannot be empty");
export const email = z.string().email("Invalid email address");
export const url = z.string().url("Invalid URL");
export const uuid = z.string().uuid("Invalid UUID");
export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");

// Number schemas
export const positiveNumber = z.number().positive("Must be positive");
export const nonNegativeNumber = z.number().nonnegative("Cannot be negative");
export const percentage = z.number().min(0).max(100);
export const port = z.number().int().min(1).max(65535);

// Date schemas
export const dateString = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: "Invalid date string" }
);
export const futureDate = z.date().refine(
  (date) => date > new Date(),
  { message: "Date must be in the future" }
);
export const pastDate = z.date().refine(
  (date) => date < new Date(),
  { message: "Date must be in the past" }
);

// Array schemas
export const nonEmptyArray = <T extends z.ZodType>(schema: T) =>
  z.array(schema).min(1, "At least one item required");

// Object schemas
export const idObject = z.object({ id: uuid });
export const timestampObject = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Pagination
export const paginationParams = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type PaginationParams = z.infer<typeof paginationParams>;

// Search params
export const searchParams = z.object({
  q: z.string().optional(),
  filters: z.record(z.string()).optional(),
});

export type SearchParams = z.infer<typeof searchParams>;

// File upload
export const fileUpload = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number().max(10 * 1024 * 1024, "File too large (max 10MB)"),
});

// Environment variable helpers
export const envString = z.string().min(1, "Environment variable required");
export const envNumber = z.coerce.number();
export const envBoolean = z.preprocess(
  (val) => val === "true" || val === "1",
  z.boolean()
);
export const envUrl = z.string().url();
export const envPort = z.coerce.number().int().min(1).max(65535).default(3000);
`;
  }

  private getEnvValidation(context: GeneratorContext, target: "web" | "api"): string {
    const hasAuth = this.hasPlugin(context, "better-auth");
    const hasDb = this.hasPlugin(context, "drizzle");

    if (target === "web") {
      return `import { z } from "zod";

/**
 * Environment variable validation for Next.js
 */
const envSchema = z.object({
  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3001"),
  
  // Node
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
${hasAuth ? `
  // Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().optional(),
` : ""}
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  
  return parsed.data;
}

export const env = validateEnv();
`;
    }

    // API env validation
    return `import { z } from "zod";

/**
 * Environment variable validation for NestJS API
 */
const envSchema = z.object({
  // App
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  API_PREFIX: z.string().default("/api"),
  
  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
${hasDb ? `
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.coerce.number().default(10),
` : ""}${hasAuth ? `
  // Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().optional(),
` : ""}
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
    throw new Error("Invalid environment variables");
  }
  
  return parsed.data;
}

export const envConfig = validateEnv();
`;
  }
}
