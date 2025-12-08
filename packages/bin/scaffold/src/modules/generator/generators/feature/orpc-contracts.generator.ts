/**
 * ORPC Contracts Generator
 *
 * Generates expanded type-safe API contracts with Zod schemas.
 * This extends the base ORPC setup with additional contract patterns:
 * - CRUD operation contracts
 * - Domain-specific schemas
 * - Error handling patterns
 * - Response wrapper types
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
export class OrpcContractsGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "orpc-contracts",
    priority: 25,
    version: "1.0.0",
    description: "Expanded type-safe API contracts with Zod schemas",
    dependencies: ["orpc"],
    contributesTo: ["packages/contracts/api"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];

    // Enhanced contract patterns
    files.push(
      this.file("packages/contracts/api/src/helpers/crud.ts", this.getCrudHelpers()),
      this.file("packages/contracts/api/src/helpers/response.ts", this.getResponseHelpers()),
      this.file("packages/contracts/api/src/helpers/validation.ts", this.getValidationHelpers()),
      this.file("packages/contracts/api/src/helpers/index.ts", this.getHelpersIndex()),
    );

    // Domain schemas
    files.push(
      this.file("packages/contracts/api/src/schemas/error.ts", this.getErrorSchemas()),
      this.file("packages/contracts/api/src/schemas/pagination.ts", this.getPaginationSchemas()),
      this.file("packages/contracts/api/src/schemas/filter.ts", this.getFilterSchemas()),
      this.file("packages/contracts/api/src/schemas/audit.ts", this.getAuditSchemas(context)),
    );

    // Update schema index with new schemas
    files.push(
      this.file("packages/contracts/api/src/schemas/index.ts", this.getSchemasIndex(context), {
        mergeStrategy: "replace",
        skipIfExists: true,
      }),
    );

    // Contract builder utilities
    files.push(
      this.file("packages/contracts/api/src/builders/contract-builder.ts", this.getContractBuilder()),
      this.file("packages/contracts/api/src/builders/route-builder.ts", this.getRouteBuilder()),
      this.file("packages/contracts/api/src/builders/index.ts", this.getBuildersIndex()),
    );

    // Example domain contracts
    files.push(
      this.file("packages/contracts/api/src/domains/example.contract.ts", this.getExampleContract()),
      this.file("packages/contracts/api/src/domains/index.ts", this.getDomainsIndex()),
    );

    // Update main contract index to include helpers and builders
    files.push(
      this.file("packages/contracts/api/src/index.ts", this.getEnhancedContractsIndex(), {
        mergeStrategy: "replace",
        skipIfExists: true,
      }),
    );

    return files;
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    // Most deps are already in orpc.generator, just add any extras
    return [
      // No additional deps needed - orpc.generator handles @orpc/contract and zod
    ];
  }

  protected override getScripts(_context: GeneratorContext): ScriptSpec[] {
    return [
      {
        name: "contracts:check",
        command: "tsc --noEmit",
        target: "packages/contracts/api",
        description: "Type-check contracts",
        pluginId: "orpc-contracts",
      },
    ];
  }

  private getCrudHelpers(): string {
    return `import { oc } from "@orpc/contract";
import { z } from "zod";
import { paginatedResponseSchema, paginationQuerySchema } from "../schemas/pagination";
import { apiErrorSchema } from "../schemas/error";

/**
 * CRUD Contract Helpers
 *
 * Factory functions for creating standardized CRUD contracts
 */

/**
 * Create a standard list endpoint contract
 */
export function createListContract<T extends z.ZodTypeAny>(
  path: string,
  itemSchema: T,
  options?: {
    description?: string;
    tags?: string[];
  }
) {
  return oc
    .route({ method: "GET", path })
    .input(paginationQuerySchema)
    .output(paginatedResponseSchema(itemSchema))
    .errors({
      BAD_REQUEST: apiErrorSchema,
      INTERNAL_ERROR: apiErrorSchema,
    });
}

/**
 * Create a standard get-by-id endpoint contract
 */
export function createGetContract<T extends z.ZodTypeAny>(
  path: string,
  itemSchema: T,
  options?: {
    description?: string;
    tags?: string[];
  }
) {
  return oc
    .route({ method: "GET", path })
    .input(z.object({ id: z.string().uuid() }))
    .output(itemSchema)
    .errors({
      NOT_FOUND: apiErrorSchema,
      BAD_REQUEST: apiErrorSchema,
    });
}

/**
 * Create a standard create endpoint contract
 */
export function createCreateContract<
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny
>(
  path: string,
  inputSchema: TInput,
  outputSchema: TOutput,
  options?: {
    description?: string;
    tags?: string[];
  }
) {
  return oc
    .route({ method: "POST", path })
    .input(inputSchema)
    .output(outputSchema)
    .errors({
      BAD_REQUEST: apiErrorSchema,
      CONFLICT: apiErrorSchema,
      INTERNAL_ERROR: apiErrorSchema,
    });
}

/**
 * Create a standard update endpoint contract
 */
export function createUpdateContract<
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny
>(
  path: string,
  inputSchema: TInput,
  outputSchema: TOutput,
  options?: {
    description?: string;
    tags?: string[];
  }
) {
  return oc
    .route({ method: "PATCH", path })
    .input(inputSchema.and(z.object({ id: z.string().uuid() })))
    .output(outputSchema)
    .errors({
      NOT_FOUND: apiErrorSchema,
      BAD_REQUEST: apiErrorSchema,
      CONFLICT: apiErrorSchema,
    });
}

/**
 * Create a standard delete endpoint contract
 */
export function createDeleteContract(
  path: string,
  options?: {
    description?: string;
    tags?: string[];
    softDelete?: boolean;
  }
) {
  return oc
    .route({ method: "DELETE", path })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean(), deletedAt: z.date().optional() }))
    .errors({
      NOT_FOUND: apiErrorSchema,
      FORBIDDEN: apiErrorSchema,
    });
}

/**
 * Create a complete CRUD router for a resource
 */
export function createCrudContracts<
  TItem extends z.ZodTypeAny,
  TCreate extends z.ZodTypeAny,
  TUpdate extends z.ZodTypeAny
>(
  basePath: string,
  schemas: {
    item: TItem;
    create: TCreate;
    update: TUpdate;
  },
  options?: {
    tags?: string[];
    omit?: ("list" | "get" | "create" | "update" | "delete")[];
  }
) {
  const omit = options?.omit ?? [];

  return {
    ...(!omit.includes("list") && {
      list: createListContract(basePath, schemas.item),
    }),
    ...(!omit.includes("get") && {
      get: createGetContract(\`\${basePath}/:id\`, schemas.item),
    }),
    ...(!omit.includes("create") && {
      create: createCreateContract(basePath, schemas.create, schemas.item),
    }),
    ...(!omit.includes("update") && {
      update: createUpdateContract(\`\${basePath}/:id\`, schemas.update, schemas.item),
    }),
    ...(!omit.includes("delete") && {
      delete: createDeleteContract(\`\${basePath}/:id\`),
    }),
  };
}
`;
  }

  private getResponseHelpers(): string {
    return `import { z } from "zod";

/**
 * Response Helper Types
 *
 * Standardized response wrappers for API contracts
 */

/**
 * Success response wrapper
 */
export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z.record(z.unknown()).optional(),
  });

/**
 * Error response wrapper
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
    path: z.string().optional(),
    timestamp: z.string().datetime(),
  }),
});

/**
 * Combined response type
 */
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.union([successResponseSchema(dataSchema), errorResponseSchema]);

/**
 * Batch operation response
 */
export const batchResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    processed: z.number(),
    failed: z.number(),
    results: z.array(
      z.object({
        id: z.string(),
        success: z.boolean(),
        data: itemSchema.optional(),
        error: z.string().optional(),
      })
    ),
  });

/**
 * Health check response
 */
export const healthResponseSchema = z.object({
  status: z.enum(["ok", "degraded", "unhealthy"]),
  version: z.string().optional(),
  timestamp: z.string().datetime(),
  services: z
    .record(
      z.object({
        status: z.enum(["ok", "degraded", "unhealthy"]),
        latency: z.number().optional(),
        message: z.string().optional(),
      })
    )
    .optional(),
});

export type SuccessResponse<T> = z.infer<ReturnType<typeof successResponseSchema<z.ZodType<T>>>>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type ApiResponse<T> = z.infer<ReturnType<typeof apiResponseSchema<z.ZodType<T>>>>;
export type BatchResponse<T> = z.infer<ReturnType<typeof batchResponseSchema<z.ZodType<T>>>>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
`;
  }

  private getValidationHelpers(): string {
    return `import { z } from "zod";

/**
 * Validation Helper Schemas
 *
 * Reusable validation patterns for common data types
 */

// String validators
export const emailSchema = z.string().email().toLowerCase().trim();
export const usernameSchema = z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/);
export const passwordSchema = z.string().min(8).max(100);
export const slugSchema = z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const urlSchema = z.string().url();
export const phoneSchema = z.string().regex(/^\\+?[1-9]\\d{1,14}$/);

// ID validators
export const uuidSchema = z.string().uuid();
export const cuidSchema = z.string().cuid();
export const nanoidSchema = z.string().length(21);

// Date validators
export const dateStringSchema = z.string().datetime();
export const dateRangeSchema = z.object({
  from: z.date(),
  to: z.date(),
}).refine((data) => data.from <= data.to, {
  message: "Start date must be before end date",
});

// Number validators
export const positiveIntSchema = z.number().int().positive();
export const percentageSchema = z.number().min(0).max(100);
export const priceSchema = z.number().positive().multipleOf(0.01);

// Object validators
export const metadataSchema = z.record(z.string(), z.unknown());
export const tagsSchema = z.array(z.string().min(1).max(50)).max(20);

// File validators
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimetype: z.string(),
  size: z.number().positive().max(50 * 1024 * 1024), // 50MB max
  encoding: z.string().optional(),
});

/**
 * Create an enum schema with description
 */
export function createEnumSchema<T extends [string, ...string[]]>(
  values: T,
  descriptions?: Record<T[number], string>
) {
  return z.enum(values).describe(
    descriptions
      ? Object.entries(descriptions)
          .map(([key, desc]) => \`\${key}: \${desc}\`)
          .join(", ")
      : values.join(" | ")
  );
}

/**
 * Create a schema with optional fields
 */
export function createPartialSchema<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).partial();
}

/**
 * Create a schema that requires at least one field
 */
export function createAtLeastOneSchema<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).partial().refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: "At least one field is required" }
  );
}
`;
  }

  private getHelpersIndex(): string {
    return `/**
 * Contract Helpers Index
 */
export * from "./crud";
export * from "./response";
export * from "./validation";
`;
  }

  private getErrorSchemas(): string {
    return `import { z } from "zod";

/**
 * Error Schemas
 *
 * Standardized error types for API contracts
 */

/**
 * Base API error schema
 */
export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

/**
 * Validation error schema
 */
export const validationErrorSchema = z.object({
  code: z.literal("VALIDATION_ERROR"),
  message: z.string(),
  errors: z.array(
    z.object({
      field: z.string(),
      message: z.string(),
      code: z.string().optional(),
    })
  ),
});

export type ValidationError = z.infer<typeof validationErrorSchema>;

/**
 * Not found error schema
 */
export const notFoundErrorSchema = z.object({
  code: z.literal("NOT_FOUND"),
  message: z.string(),
  resource: z.string().optional(),
  id: z.string().optional(),
});

export type NotFoundError = z.infer<typeof notFoundErrorSchema>;

/**
 * Unauthorized error schema
 */
export const unauthorizedErrorSchema = z.object({
  code: z.literal("UNAUTHORIZED"),
  message: z.string(),
  reason: z.enum(["invalid_token", "expired_token", "missing_token"]).optional(),
});

export type UnauthorizedError = z.infer<typeof unauthorizedErrorSchema>;

/**
 * Forbidden error schema
 */
export const forbiddenErrorSchema = z.object({
  code: z.literal("FORBIDDEN"),
  message: z.string(),
  requiredPermission: z.string().optional(),
});

export type ForbiddenError = z.infer<typeof forbiddenErrorSchema>;

/**
 * Conflict error schema
 */
export const conflictErrorSchema = z.object({
  code: z.literal("CONFLICT"),
  message: z.string(),
  conflictingField: z.string().optional(),
});

export type ConflictError = z.infer<typeof conflictErrorSchema>;

/**
 * Rate limit error schema
 */
export const rateLimitErrorSchema = z.object({
  code: z.literal("RATE_LIMIT_EXCEEDED"),
  message: z.string(),
  retryAfter: z.number().optional(),
  limit: z.number().optional(),
  remaining: z.number().optional(),
});

export type RateLimitError = z.infer<typeof rateLimitErrorSchema>;

/**
 * Internal server error schema
 */
export const internalErrorSchema = z.object({
  code: z.literal("INTERNAL_ERROR"),
  message: z.string(),
  requestId: z.string().optional(),
});

export type InternalError = z.infer<typeof internalErrorSchema>;

/**
 * Union of all error types
 */
export const contractErrorSchema = z.discriminatedUnion("code", [
  validationErrorSchema,
  notFoundErrorSchema,
  unauthorizedErrorSchema,
  forbiddenErrorSchema,
  conflictErrorSchema,
  rateLimitErrorSchema,
  internalErrorSchema,
]);

export type ContractError = z.infer<typeof contractErrorSchema>;
`;
  }

  private getPaginationSchemas(): string {
    return `import { z } from "zod";

/**
 * Pagination Schemas
 *
 * Standardized pagination patterns
 */

/**
 * Pagination query parameters
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/**
 * Pagination metadata
 */
export const paginationMetaSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

/**
 * Paginated response wrapper
 */
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    meta: paginationMetaSchema,
  });

export type PaginatedResponse<T> = {
  items: T[];
  meta: PaginationMeta;
};

/**
 * Cursor-based pagination query
 */
export const cursorPaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  direction: z.enum(["forward", "backward"]).default("forward"),
});

export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;

/**
 * Cursor-based pagination metadata
 */
export const cursorPaginationMetaSchema = z.object({
  nextCursor: z.string().nullable(),
  prevCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type CursorPaginationMeta = z.infer<typeof cursorPaginationMetaSchema>;

/**
 * Cursor-paginated response wrapper
 */
export const cursorPaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    meta: cursorPaginationMetaSchema,
  });

export type CursorPaginatedResponse<T> = {
  items: T[];
  meta: CursorPaginationMeta;
};

/**
 * Offset-based pagination (simpler alternative)
 */
export const offsetPaginationQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type OffsetPaginationQuery = z.infer<typeof offsetPaginationQuerySchema>;
`;
  }

  private getFilterSchemas(): string {
    return `import { z } from "zod";

/**
 * Filter Schemas
 *
 * Standardized filtering patterns for list queries
 */

/**
 * Text search filter
 */
export const textSearchSchema = z.object({
  q: z.string().min(1).max(200).optional(),
  searchFields: z.array(z.string()).optional(),
});

export type TextSearch = z.infer<typeof textSearchSchema>;

/**
 * Date range filter
 */
export const dateRangeFilterSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  { message: "Start date must be before end date" }
);

export type DateRangeFilter = z.infer<typeof dateRangeFilterSchema>;

/**
 * Status filter
 */
export const statusFilterSchema = z.object({
  status: z.union([
    z.string(),
    z.array(z.string()),
  ]).optional(),
  excludeStatus: z.union([
    z.string(),
    z.array(z.string()),
  ]).optional(),
});

export type StatusFilter = z.infer<typeof statusFilterSchema>;

/**
 * ID filter (for relations)
 */
export const idFilterSchema = z.object({
  id: z.union([z.string().uuid(), z.array(z.string().uuid())]).optional(),
  excludeId: z.union([z.string().uuid(), z.array(z.string().uuid())]).optional(),
});

export type IdFilter = z.infer<typeof idFilterSchema>;

/**
 * Common filters combined
 */
export const commonFiltersSchema = z.object({
  ...textSearchSchema.shape,
  ...dateRangeFilterSchema.shape,
  ...statusFilterSchema.shape,
  isActive: z.coerce.boolean().optional(),
  isDeleted: z.coerce.boolean().optional(),
});

export type CommonFilters = z.infer<typeof commonFiltersSchema>;

/**
 * Create a filter schema for a specific entity
 */
export function createFilterSchema<T extends z.ZodRawShape>(
  entityFields: T,
  options?: {
    includeTextSearch?: boolean;
    includeDateRange?: boolean;
    includeStatus?: boolean;
  }
) {
  const shapes: z.ZodRawShape[] = [entityFields];

  if (options?.includeTextSearch !== false) {
    shapes.push(textSearchSchema.shape);
  }
  if (options?.includeDateRange !== false) {
    shapes.push(dateRangeFilterSchema.shape);
  }
  if (options?.includeStatus !== false) {
    shapes.push(statusFilterSchema.shape);
  }

  return z.object(
    shapes.reduce((acc, shape) => ({ ...acc, ...shape }), {})
  );
}

/**
 * Sort options schema
 */
export function createSortSchema<T extends string>(allowedFields: T[]) {
  return z.object({
    sortBy: z.enum(allowedFields as [T, ...T[]]).optional(),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  });
}
`;
  }

  private getAuditSchemas(context: GeneratorContext): string {
    const hasAuth = this.hasPlugin(context, "better-auth");

    return `import { z } from "zod";

/**
 * Audit Schemas
 *
 * Schemas for tracking entity changes and audit logs
 */

/**
 * Timestamp fields
 */
export const timestampsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Timestamps = z.infer<typeof timestampsSchema>;

/**
 * Soft delete fields
 */
export const softDeleteSchema = z.object({
  deletedAt: z.date().nullable(),
  isDeleted: z.boolean().default(false),
});

export type SoftDelete = z.infer<typeof softDeleteSchema>;

/**
 * Audit fields (who created/modified)
 */
export const auditFieldsSchema = z.object({
  createdBy: z.string().uuid()${hasAuth ? "" : ".optional()"},
  updatedBy: z.string().uuid()${hasAuth ? "" : ".optional()"},
  deletedBy: z.string().uuid().nullable(),
});

export type AuditFields = z.infer<typeof auditFieldsSchema>;

/**
 * Complete auditable entity schema
 */
export const auditableSchema = z.object({
  ...timestampsSchema.shape,
  ...softDeleteSchema.shape,
  ...auditFieldsSchema.shape,
});

export type Auditable = z.infer<typeof auditableSchema>;

/**
 * Audit log entry
 */
export const auditLogSchema = z.object({
  id: z.string().uuid(),
  entityType: z.string(),
  entityId: z.string(),
  action: z.enum(["create", "update", "delete", "restore"]),
  changes: z.record(
    z.object({
      from: z.unknown(),
      to: z.unknown(),
    })
  ).optional(),
  performedBy: z.string().uuid()${hasAuth ? "" : ".optional()"},
  performedAt: z.date(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

/**
 * Versioned entity schema
 */
export const versionedSchema = z.object({
  version: z.number().int().min(1).default(1),
  versionHistory: z.array(
    z.object({
      version: z.number(),
      data: z.unknown(),
      modifiedAt: z.date(),
      modifiedBy: z.string().uuid().optional(),
    })
  ).optional(),
});

export type Versioned = z.infer<typeof versionedSchema>;
`;
  }

  private getSchemasIndex(context: GeneratorContext): string {
    return `/**
 * Schema Exports
 *
 * Central export point for all API schemas
 */

// Common schemas
export * from "./common";
export * from "./user";

// Error schemas
export * from "./error";

// Pagination schemas
export * from "./pagination";

// Filter schemas
export * from "./filter";

// Audit schemas
export * from "./audit";
`;
  }

  private getContractBuilder(): string {
    return `import { oc } from "@orpc/contract";
import { z } from "zod";
import { paginationQuerySchema, paginatedResponseSchema } from "../schemas/pagination";
import { commonFiltersSchema } from "../schemas/filter";
import { apiErrorSchema } from "../schemas/error";

/**
 * Contract Builder
 *
 * Fluent builder for creating standardized API contracts
 */

export class ContractBuilder<
  TItem extends z.ZodTypeAny = z.ZodUnknown,
  TCreate extends z.ZodTypeAny = z.ZodUnknown,
  TUpdate extends z.ZodTypeAny = z.ZodUnknown
> {
  private basePath: string;
  private itemSchema: TItem;
  private createSchema?: TCreate;
  private updateSchema?: TUpdate;
  private tags: string[] = [];

  constructor(basePath: string, itemSchema: TItem) {
    this.basePath = basePath;
    this.itemSchema = itemSchema;
  }

  /**
   * Set the create schema
   */
  withCreateSchema<T extends z.ZodTypeAny>(schema: T): ContractBuilder<TItem, T, TUpdate> {
    return Object.assign(new ContractBuilder(this.basePath, this.itemSchema), {
      ...this,
      createSchema: schema,
    }) as ContractBuilder<TItem, T, TUpdate>;
  }

  /**
   * Set the update schema
   */
  withUpdateSchema<T extends z.ZodTypeAny>(schema: T): ContractBuilder<TItem, TCreate, T> {
    return Object.assign(new ContractBuilder(this.basePath, this.itemSchema), {
      ...this,
      updateSchema: schema,
    }) as ContractBuilder<TItem, TCreate, T>;
  }

  /**
   * Add tags for documentation
   */
  withTags(...tags: string[]): this {
    this.tags = tags;
    return this;
  }

  /**
   * Build list endpoint
   */
  buildList() {
    return oc
      .route({ method: "GET", path: this.basePath })
      .input(paginationQuerySchema.merge(commonFiltersSchema))
      .output(paginatedResponseSchema(this.itemSchema))
      .errors({ BAD_REQUEST: apiErrorSchema });
  }

  /**
   * Build get-by-id endpoint
   */
  buildGet() {
    return oc
      .route({ method: "GET", path: \`\${this.basePath}/:id\` })
      .input(z.object({ id: z.string().uuid() }))
      .output(this.itemSchema)
      .errors({
        NOT_FOUND: apiErrorSchema,
        BAD_REQUEST: apiErrorSchema,
      });
  }

  /**
   * Build create endpoint
   */
  buildCreate() {
    if (!this.createSchema) {
      throw new Error("Create schema not set. Use withCreateSchema() first.");
    }
    return oc
      .route({ method: "POST", path: this.basePath })
      .input(this.createSchema)
      .output(this.itemSchema)
      .errors({
        BAD_REQUEST: apiErrorSchema,
        CONFLICT: apiErrorSchema,
      });
  }

  /**
   * Build update endpoint
   */
  buildUpdate() {
    if (!this.updateSchema) {
      throw new Error("Update schema not set. Use withUpdateSchema() first.");
    }
    return oc
      .route({ method: "PATCH", path: \`\${this.basePath}/:id\` })
      .input(this.updateSchema.and(z.object({ id: z.string().uuid() })))
      .output(this.itemSchema)
      .errors({
        NOT_FOUND: apiErrorSchema,
        BAD_REQUEST: apiErrorSchema,
        CONFLICT: apiErrorSchema,
      });
  }

  /**
   * Build delete endpoint
   */
  buildDelete() {
    return oc
      .route({ method: "DELETE", path: \`\${this.basePath}/:id\` })
      .input(z.object({ id: z.string().uuid() }))
      .output(z.object({ success: z.boolean() }))
      .errors({
        NOT_FOUND: apiErrorSchema,
        FORBIDDEN: apiErrorSchema,
      });
  }

  /**
   * Build all CRUD endpoints
   */
  buildCrud() {
    return {
      list: this.buildList(),
      get: this.buildGet(),
      ...(this.createSchema && { create: this.buildCreate() }),
      ...(this.updateSchema && { update: this.buildUpdate() }),
      delete: this.buildDelete(),
    };
  }
}

/**
 * Factory function
 */
export function createContractBuilder<T extends z.ZodTypeAny>(
  basePath: string,
  itemSchema: T
) {
  return new ContractBuilder(basePath, itemSchema);
}
`;
  }

  private getRouteBuilder(): string {
    return `import { oc } from "@orpc/contract";
import { z } from "zod";
import { apiErrorSchema } from "../schemas/error";

/**
 * Route Builder
 *
 * Simplified route creation with common patterns
 */

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RouteOptions {
  description?: string;
  tags?: string[];
  deprecated?: boolean;
}

/**
 * Create a typed route with standard error handling
 */
export function createRoute<
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny
>(
  method: HttpMethod,
  path: string,
  inputSchema: TInput,
  outputSchema: TOutput,
  options?: RouteOptions
) {
  let route = oc.route({ method, path });

  if (inputSchema && !(inputSchema instanceof z.ZodVoid)) {
    route = route.input(inputSchema);
  }

  return route.output(outputSchema).errors({
    BAD_REQUEST: apiErrorSchema,
    INTERNAL_ERROR: apiErrorSchema,
  });
}

/**
 * Create a GET route
 */
export function get<TInput extends z.ZodTypeAny, TOutput extends z.ZodTypeAny>(
  path: string,
  output: TOutput,
  input?: TInput,
  options?: RouteOptions
) {
  return createRoute("GET", path, input ?? z.void(), output, options);
}

/**
 * Create a POST route
 */
export function post<TInput extends z.ZodTypeAny, TOutput extends z.ZodTypeAny>(
  path: string,
  input: TInput,
  output: TOutput,
  options?: RouteOptions
) {
  return createRoute("POST", path, input, output, options);
}

/**
 * Create a PUT route
 */
export function put<TInput extends z.ZodTypeAny, TOutput extends z.ZodTypeAny>(
  path: string,
  input: TInput,
  output: TOutput,
  options?: RouteOptions
) {
  return createRoute("PUT", path, input, output, options);
}

/**
 * Create a PATCH route
 */
export function patch<TInput extends z.ZodTypeAny, TOutput extends z.ZodTypeAny>(
  path: string,
  input: TInput,
  output: TOutput,
  options?: RouteOptions
) {
  return createRoute("PATCH", path, input, output, options);
}

/**
 * Create a DELETE route
 */
export function del<TOutput extends z.ZodTypeAny>(
  path: string,
  output: TOutput,
  options?: RouteOptions
) {
  return createRoute(
    "DELETE",
    path,
    z.object({ id: z.string().uuid() }),
    output,
    options
  );
}

/**
 * Route builder exports
 */
export const route = {
  get,
  post,
  put,
  patch,
  delete: del,
};
`;
  }

  private getBuildersIndex(): string {
    return `/**
 * Contract Builders Index
 */
export * from "./contract-builder";
export * from "./route-builder";
`;
  }

  private getExampleContract(): string {
    return `import { oc } from "@orpc/contract";
import { z } from "zod";
import { createContractBuilder } from "../builders/contract-builder";
import { timestampsSchema } from "../schemas/audit";
import { paginationQuerySchema, paginatedResponseSchema } from "../schemas/pagination";

/**
 * Example Domain Contract
 *
 * Demonstrates how to use the contract builder pattern
 */

// Define the item schema
export const exampleItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  status: z.enum(["draft", "active", "archived"]),
  metadata: z.record(z.unknown()).optional(),
  ...timestampsSchema.shape,
});

export type ExampleItem = z.infer<typeof exampleItemSchema>;

// Create schema
export const createExampleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateExample = z.infer<typeof createExampleSchema>;

// Update schema
export const updateExampleSchema = createExampleSchema.partial();

export type UpdateExample = z.infer<typeof updateExampleSchema>;

// Build CRUD contracts using the builder
const builder = createContractBuilder("/examples", exampleItemSchema)
  .withCreateSchema(createExampleSchema)
  .withUpdateSchema(updateExampleSchema)
  .withTags("Examples");

// Export individual contracts
export const exampleContracts = builder.buildCrud();

// Or create a full router
export const exampleRouter = oc.router({
  list: builder.buildList(),
  get: builder.buildGet(),
  create: builder.buildCreate(),
  update: builder.buildUpdate(),
  delete: builder.buildDelete(),

  // Custom endpoints
  archive: oc
    .route({ method: "POST", path: "/examples/:id/archive" })
    .input(z.object({ id: z.string().uuid() }))
    .output(exampleItemSchema),

  bulkCreate: oc
    .route({ method: "POST", path: "/examples/bulk" })
    .input(z.object({ items: z.array(createExampleSchema).max(100) }))
    .output(z.object({
      created: z.number(),
      items: z.array(exampleItemSchema),
    })),
});

export type ExampleRouter = typeof exampleRouter;
`;
  }

  private getDomainsIndex(): string {
    return `/**
 * Domain Contracts Index
 *
 * Export all domain-specific contracts
 */
export * from "./example.contract";
`;
  }

  private getEnhancedContractsIndex(): string {
    return `/**
 * API Contracts - Type-safe RPC definitions
 *
 * Central export point for all API contracts
 */

// Main contract
export * from "./contract";

// Schema exports
export * from "./schemas";

// Helper exports
export * from "./helpers";

// Builder exports
export * from "./builders";

// Domain contracts
export * from "./domains";
`;
  }
}
