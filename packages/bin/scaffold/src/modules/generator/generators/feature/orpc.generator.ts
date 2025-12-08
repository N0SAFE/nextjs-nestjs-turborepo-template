/**
 * ORPC Generator
 *
 * Sets up ORPC (OpenAPI RPC) for type-safe API contracts between NestJS and Next.js.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
  ScriptSpec,
} from "../../../../types/generator.types";

@Injectable()
export class OrpcGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "orpc",
    priority: 30,
    version: "1.0.0",
    description: "Type-safe RPC with OpenAPI integration",
    dependencies: ["typescript"],
    contributesTo: ["package.json", "tsconfig.json"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const { projectConfig } = context;
    const files: FileSpec[] = [];

    // Create contracts package
    files.push(
      this.file("packages/contracts/api/package.json", this.getContractsPackageJson(projectConfig.name), {
        mergeStrategy: "json-merge-deep",
      }),
      this.file("packages/contracts/api/tsconfig.json", this.getContractsTsConfig(), {
        mergeStrategy: "json-merge-deep",
      }),
      this.file("packages/contracts/api/src/index.ts", this.getContractsIndex()),
      this.file("packages/contracts/api/src/contract.ts", this.getContractDefinition(context)),
    );

    // Create common schemas
    files.push(
      this.file("packages/contracts/api/src/schemas/common.ts", this.getCommonSchemas()),
      this.file("packages/contracts/api/src/schemas/user.ts", this.getUserSchemas(context)),
      this.file("packages/contracts/api/src/schemas/index.ts", this.getSchemasIndex(context)),
    );

    // API integration files
    if (this.hasPlugin(context, "nestjs")) {
      files.push(
        this.file("apps/api/src/lib/orpc/index.ts", this.getApiOrpcSetup()),
        this.file("apps/api/src/lib/orpc/router.ts", this.getApiRouter(context)),
      );
    }

    // Web client files
    if (this.hasPlugin(context, "nextjs")) {
      files.push(
        this.file("apps/web/src/lib/orpc/index.ts", this.getWebOrpcClient(context)),
        this.file("apps/web/src/lib/orpc/hooks.ts", this.getWebOrpcHooks()),
      );
    }

    return files;
  }

  protected override getDependencies(context: GeneratorContext): DependencySpec[] {
    const deps: DependencySpec[] = [
      // Contracts package deps
      { name: "@orpc/contract", version: "^1.0.0", type: "prod", target: "packages/contracts/api", pluginId: "orpc" },
      { name: "zod", version: "^3.23.0", type: "prod", target: "packages/contracts/api", pluginId: "orpc" },
    ];

    if (this.hasPlugin(context, "nestjs")) {
      deps.push(
        { name: "@orpc/server", version: "^1.0.0", type: "prod", target: "apps/api", pluginId: "orpc" },
        { name: "@orpc/openapi", version: "^1.0.0", type: "prod", target: "apps/api", pluginId: "orpc" },
        { name: "@repo/api-contracts", version: "*", type: "prod", target: "apps/api", pluginId: "orpc" },
      );
    }

    if (this.hasPlugin(context, "nextjs")) {
      deps.push(
        { name: "@orpc/client", version: "^1.0.0", type: "prod", target: "apps/web", pluginId: "orpc" },
        { name: "@orpc/react-query", version: "^1.0.0", type: "prod", target: "apps/web", pluginId: "orpc" },
        { name: "@repo/api-contracts", version: "*", type: "prod", target: "apps/web", pluginId: "orpc" },
      );
    }

    return deps;
  }

  protected override getScripts(_context: GeneratorContext): ScriptSpec[] {
    return [
      { name: "contracts:build", command: "tsc -b", target: "packages/contracts/api", description: "Build API contracts", pluginId: "orpc" },
      { name: "contracts:watch", command: "tsc -b --watch", target: "packages/contracts/api", description: "Watch and build contracts", pluginId: "orpc" },
    ];
  }

  private getContractsPackageJson(projectName: string): string {
    return JSON.stringify({
      name: "@repo/api-contracts",
      version: "0.0.0",
      private: true,
      type: "module",
      exports: {
        ".": {
          types: "./src/index.ts",
          import: "./src/index.ts",
        },
      },
      scripts: {
        "type-check": "tsc --noEmit",
        build: "tsc -b",
      },
      peerDependencies: {
        typescript: "^5.0.0",
      },
    }, null, 2);
  }

  private getContractsTsConfig(): string {
    return JSON.stringify({
      extends: "@repo/typescript-config/base.json",
      compilerOptions: {
        outDir: "./dist",
        rootDir: "./src",
        declaration: true,
        declarationMap: true,
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"],
    }, null, 2);
  }

  private getContractsIndex(): string {
    return `/**
 * API Contracts - Type-safe RPC definitions
 */
export * from "./contract";
export * from "./schemas";
`;
  }

  private getContractDefinition(context: GeneratorContext): string {
    const hasAuth = this.hasPlugin(context, "better-auth");

    return `import { oc } from "@orpc/contract";
import { z } from "zod";
import { userSchema, paginationSchema, errorSchema } from "./schemas";

/**
 * API Contract Definition
 * Type-safe RPC contract shared between API and Web
 */
export const contract = oc.router({
  // Health check
  health: oc
    .route({ method: "GET", path: "/health" })
    .output(z.object({
      status: z.enum(["ok", "degraded", "unhealthy"]),
      timestamp: z.string(),
      version: z.string().optional(),
    })),

  // User routes${hasAuth ? `
  user: oc.router({
    me: oc
      .route({ method: "GET", path: "/user/me" })
      .output(userSchema),
    
    list: oc
      .route({ method: "GET", path: "/users" })
      .input(paginationSchema)
      .output(z.object({
        users: z.array(userSchema),
        total: z.number(),
        page: z.number(),
        pageSize: z.number(),
      })),
  }),` : ""}
});

export type AppContract = typeof contract;
`;
  }

  private getCommonSchemas(): string {
    return `import { z } from "zod";

/**
 * Common schemas used across the API
 */

// Pagination
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type Pagination = z.infer<typeof paginationSchema>;

// Error responses
export const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

export type ApiError = z.infer<typeof errorSchema>;

// Success wrapper
export const successSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
});

// ID schema
export const idSchema = z.object({
  id: z.string().uuid(),
});

export type IdParam = z.infer<typeof idSchema>;

// Timestamp schemas
export const timestampsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Timestamps = z.infer<typeof timestampsSchema>;
`;
  }

  private getUserSchemas(context: GeneratorContext): string {
    const hasAuth = this.hasPlugin(context, "better-auth");

    if (!hasAuth) {
      return `import { z } from "zod";

// Basic user schema (no auth)
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;
`;
    }

    return `import { z } from "zod";

/**
 * User schemas with authentication
 */

// Base user schema
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().url().nullable(),
  emailVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

// User creation
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(100),
});

export type CreateUser = z.infer<typeof createUserSchema>;

// User update
export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().optional(),
});

export type UpdateUser = z.infer<typeof updateUserSchema>;

// Session schema
export const sessionSchema = z.object({
  id: z.string(),
  userId: z.string().uuid(),
  expiresAt: z.date(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
});

export type Session = z.infer<typeof sessionSchema>;
`;
  }

  private getSchemasIndex(context: GeneratorContext): string {
    return `/**
 * Schema exports
 */
export * from "./common";
export * from "./user";
`;
  }

  private getApiOrpcSetup(): string {
    return `import { createORPCHandler } from "@orpc/server/fetch";
import { router } from "./router";

/**
 * ORPC Handler for NestJS
 */
export const orpcHandler = createORPCHandler({
  router,
  prefix: "/api",
});

export { router };
`;
  }

  private getApiRouter(context: GeneratorContext): string {
    const hasAuth = this.hasPlugin(context, "better-auth");

    return `import { os } from "@orpc/server";
import { contract } from "@repo/api-contracts";

/**
 * ORPC Router Implementation
 */

const publicProcedure = os.contract(contract);

export const router = os.router({
  health: publicProcedure.health.handler(async () => {
    return {
      status: "ok" as const,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    };
  }),
${hasAuth ? `
  user: os.router({
    me: publicProcedure.user.me.handler(async ({ context }) => {
      // Get user from session
      const user = context.user;
      if (!user) {
        throw new Error("Unauthorized");
      }
      return user;
    }),
    
    list: publicProcedure.user.list.handler(async ({ input }) => {
      // Implement user list logic
      return {
        users: [],
        total: 0,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),
  }),` : ""}
});

export type AppRouter = typeof router;
`;
  }

  private getWebOrpcClient(context: GeneratorContext): string {
    const apiPort = context.projectConfig.ports.api || 3001;

    return `import { createORPCClient } from "@orpc/client";
import { createORPCReactQueryUtils } from "@orpc/react-query";
import type { AppContract } from "@repo/api-contracts";

/**
 * ORPC Client Configuration
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:${apiPort}";

export const orpcClient = createORPCClient<AppContract>({
  baseURL: \`\${API_URL}/api\`,
  fetch: (url, init) => {
    return fetch(url, {
      ...init,
      credentials: "include",
    });
  },
});

export const orpc = createORPCReactQueryUtils(orpcClient);
`;
  }

  private getWebOrpcHooks(): string {
    return `"use client";

import { orpc } from "./index";

/**
 * Custom ORPC hooks for common operations
 */

// Health check hook
export function useHealthCheck() {
  return orpc.health.useQuery(undefined, {
    refetchInterval: 30000, // Check every 30s
    staleTime: 10000,
  });
}

// User hooks (when auth is enabled)
export function useCurrentUser() {
  return orpc.user?.me?.useQuery(undefined, {
    staleTime: 60000,
    retry: false,
  });
}

export function useUsers(params: { page?: number; pageSize?: number } = {}) {
  return orpc.user?.list?.useQuery({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
  });
}
`;
  }
}
