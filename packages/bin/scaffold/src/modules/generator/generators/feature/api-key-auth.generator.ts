/**
 * API Key Authentication Generator
 *
 * Sets up API key authentication for service-to-service communication.
 * Enables secure machine-to-machine authentication using API keys
 * with scoping, rate limiting, and audit logging support.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
} from "../../../../types/generator.types";

@Injectable()
export class ApiKeyAuthGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "api-key-auth",
    priority: 37, // After permission-system
    version: "1.0.0",
    description: "API key authentication for service-to-service communication",
    contributesTo: [
      "apps/api/src/auth/**",
      "apps/api/src/api-keys/**",
      "packages/contracts/api/src/**",
    ],
    dependsOn: ["better-auth"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];

    // API: API Key service for CRUD operations
    files.push(
      this.file(
        "apps/api/src/api-keys/api-key.service.ts",
        this.getApiKeyServiceContent(),
        { mergeStrategy: "replace", priority: 37 },
      ),
    );

    // API: API Key controller for management endpoints
    files.push(
      this.file(
        "apps/api/src/api-keys/api-key.controller.ts",
        this.getApiKeyControllerContent(),
        { mergeStrategy: "replace", priority: 37 },
      ),
    );

    // API: API Key module
    files.push(
      this.file(
        "apps/api/src/api-keys/api-key.module.ts",
        this.getApiKeyModuleContent(),
        { mergeStrategy: "replace", priority: 37 },
      ),
    );

    // API: API Key guard for protecting routes
    files.push(
      this.file(
        "apps/api/src/api-keys/guards/api-key.guard.ts",
        this.getApiKeyGuardContent(),
        { mergeStrategy: "replace", priority: 37 },
      ),
    );

    // API: API Key decorator
    files.push(
      this.file(
        "apps/api/src/api-keys/decorators/api-key.decorator.ts",
        this.getApiKeyDecoratorContent(),
        { mergeStrategy: "replace", priority: 37 },
      ),
    );

    // API: API Key types
    files.push(
      this.file(
        "apps/api/src/api-keys/types/api-key.types.ts",
        this.getApiKeyTypesContent(),
        { mergeStrategy: "replace", priority: 37 },
      ),
    );

    // API: API Key barrel export
    files.push(
      this.file(
        "apps/api/src/api-keys/index.ts",
        this.getApiKeyIndexContent(),
        { mergeStrategy: "replace", priority: 37 },
      ),
    );

    // Drizzle schema for API keys if drizzle is enabled
    if (this.hasPlugin(context, "drizzle")) {
      files.push(
        this.file(
          "apps/api/src/db/drizzle/schema/api-keys.schema.ts",
          this.getApiKeySchemaContent(),
          { mergeStrategy: "replace", priority: 37 },
        ),
      );
    }

    // ORPC contract if orpc is enabled
    if (this.hasPlugin(context, "orpc")) {
      files.push(
        this.file(
          "packages/contracts/api/src/api-keys/api-keys.contract.ts",
          this.getApiKeyContractContent(),
          { mergeStrategy: "replace", priority: 37 },
        ),
      );

      files.push(
        this.file(
          "packages/contracts/api/src/api-keys/index.ts",
          this.getApiKeyContractIndexContent(),
          { mergeStrategy: "replace", priority: 37 },
        ),
      );
    }

    // Environment example
    files.push(
      this.file(
        "apps/api/.env.api-keys.example",
        this.getEnvExampleContent(),
        { mergeStrategy: "replace", priority: 37 },
      ),
    );

    return files;
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    return [
      {
        name: "nanoid",
        version: "^5.0.0",
        type: "prod",
        target: "apps/api",
      },
    ];
  }

  private getApiKeyServiceContent(): string {
    return `/**
 * API Key Service
 *
 * Provides CRUD operations for API keys with:
 * - Secure key generation using nanoid
 * - Key hashing for storage security
 * - Scope-based access control
 * - Rate limiting support
 * - Audit logging
 *
 * @example
 * // Create a new API key
 * const apiKey = await apiKeyService.create({
 *   name: 'Production Server',
 *   scopes: ['read:users', 'write:orders'],
 *   expiresAt: new Date('2025-12-31'),
 * });
 *
 * // Validate an API key
 * const keyData = await apiKeyService.validate('sk_live_...');
 */
import { Injectable, UnauthorizedException, NotFoundException } from "@nestjs/common";
import { nanoid } from "nanoid";
import { createHash, timingSafeEqual } from "crypto";
import type {
  ApiKey,
  ApiKeyCreateInput,
  ApiKeyUpdateInput,
  ApiKeyValidationResult,
  ApiKeyScope,
} from "./types/api-key.types";

@Injectable()
export class ApiKeyService {
  // In production, inject DrizzleService and use database
  private apiKeys: Map<string, ApiKey & { hashedKey: string }> = new Map();

  /**
   * Generate a secure API key prefix
   * Format: sk_{environment}_{random}
   */
  private generateKeyPrefix(environment: "live" | "test" = "live"): string {
    return \`sk_\${environment}_\`;
  }

  /**
   * Generate a new API key
   * Returns the full key only once - it cannot be retrieved later
   */
  private generateKey(environment: "live" | "test" = "live"): string {
    const prefix = this.generateKeyPrefix(environment);
    const randomPart = nanoid(32);
    return \`\${prefix}\${randomPart}\`;
  }

  /**
   * Hash an API key for secure storage
   * Uses SHA-256 for consistent hashing
   */
  private hashKey(key: string): string {
    return createHash("sha256").update(key).digest("hex");
  }

  /**
   * Securely compare two hashed keys
   * Uses timing-safe comparison to prevent timing attacks
   */
  private secureCompare(a: string, b: string): boolean {
    try {
      const bufA = Buffer.from(a, "hex");
      const bufB = Buffer.from(b, "hex");
      if (bufA.length !== bufB.length) return false;
      return timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  /**
   * Create a new API key
   * Returns the full key - store it securely, it won't be shown again
   */
  async create(input: ApiKeyCreateInput): Promise<{ apiKey: ApiKey; key: string }> {
    const key = this.generateKey(input.environment ?? "live");
    const hashedKey = this.hashKey(key);
    const keyPrefix = key.substring(0, 12); // Store prefix for identification

    const apiKey: ApiKey = {
      id: nanoid(),
      name: input.name,
      keyPrefix,
      scopes: input.scopes ?? [],
      environment: input.environment ?? "live",
      userId: input.userId,
      organizationId: input.organizationId,
      rateLimit: input.rateLimit ?? { requestsPerMinute: 60, requestsPerHour: 1000 },
      expiresAt: input.expiresAt ?? null,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      metadata: input.metadata ?? {},
    };

    this.apiKeys.set(apiKey.id, { ...apiKey, hashedKey });

    return { apiKey, key };
  }

  /**
   * Validate an API key and return associated data
   * Updates lastUsedAt on successful validation
   */
  async validate(key: string): Promise<ApiKeyValidationResult> {
    const hashedKey = this.hashKey(key);

    for (const [id, stored] of this.apiKeys.entries()) {
      if (this.secureCompare(stored.hashedKey, hashedKey)) {
        // Check if key is active
        if (!stored.isActive) {
          return { valid: false, reason: "API key is disabled" };
        }

        // Check expiration
        if (stored.expiresAt && new Date() > stored.expiresAt) {
          return { valid: false, reason: "API key has expired" };
        }

        // Update last used timestamp
        stored.lastUsedAt = new Date();
        stored.updatedAt = new Date();

        const { hashedKey: _, ...apiKey } = stored;
        return {
          valid: true,
          apiKey,
        };
      }
    }

    return { valid: false, reason: "Invalid API key" };
  }

  /**
   * Check if an API key has a specific scope
   */
  hasScope(apiKey: ApiKey, scope: ApiKeyScope): boolean {
    // Wildcard scope grants all permissions
    if (apiKey.scopes.includes("*")) return true;

    // Check exact match
    if (apiKey.scopes.includes(scope)) return true;

    // Check namespace wildcard (e.g., "read:*" matches "read:users")
    const [action, resource] = scope.split(":");
    if (apiKey.scopes.includes(\`\${action}:*\`)) return true;

    return false;
  }

  /**
   * Get an API key by ID
   */
  async findById(id: string): Promise<ApiKey | null> {
    const stored = this.apiKeys.get(id);
    if (!stored) return null;
    const { hashedKey: _, ...apiKey } = stored;
    return apiKey;
  }

  /**
   * List API keys for a user or organization
   */
  async list(filters: {
    userId?: string;
    organizationId?: string;
    isActive?: boolean;
  }): Promise<ApiKey[]> {
    const results: ApiKey[] = [];

    for (const stored of this.apiKeys.values()) {
      const { hashedKey: _, ...apiKey } = stored;

      if (filters.userId && apiKey.userId !== filters.userId) continue;
      if (filters.organizationId && apiKey.organizationId !== filters.organizationId) continue;
      if (filters.isActive !== undefined && apiKey.isActive !== filters.isActive) continue;

      results.push(apiKey);
    }

    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Update an API key
   */
  async update(id: string, input: ApiKeyUpdateInput): Promise<ApiKey> {
    const stored = this.apiKeys.get(id);
    if (!stored) {
      throw new NotFoundException(\`API key with ID \${id} not found\`);
    }

    if (input.name !== undefined) stored.name = input.name;
    if (input.scopes !== undefined) stored.scopes = input.scopes;
    if (input.rateLimit !== undefined) stored.rateLimit = input.rateLimit;
    if (input.expiresAt !== undefined) stored.expiresAt = input.expiresAt;
    if (input.isActive !== undefined) stored.isActive = input.isActive;
    if (input.metadata !== undefined) stored.metadata = { ...stored.metadata, ...input.metadata };
    stored.updatedAt = new Date();

    const { hashedKey: _, ...apiKey } = stored;
    return apiKey;
  }

  /**
   * Revoke (soft delete) an API key
   */
  async revoke(id: string): Promise<void> {
    const stored = this.apiKeys.get(id);
    if (!stored) {
      throw new NotFoundException(\`API key with ID \${id} not found\`);
    }

    stored.isActive = false;
    stored.updatedAt = new Date();
  }

  /**
   * Permanently delete an API key
   */
  async delete(id: string): Promise<void> {
    if (!this.apiKeys.has(id)) {
      throw new NotFoundException(\`API key with ID \${id} not found\`);
    }

    this.apiKeys.delete(id);
  }

  /**
   * Rotate an API key (create new, revoke old)
   */
  async rotate(id: string): Promise<{ apiKey: ApiKey; key: string }> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(\`API key with ID \${id} not found\`);
    }

    // Create new key with same settings
    const { apiKey: newApiKey, key } = await this.create({
      name: \`\${existing.name} (rotated)\`,
      scopes: existing.scopes,
      environment: existing.environment,
      userId: existing.userId,
      organizationId: existing.organizationId,
      rateLimit: existing.rateLimit,
      expiresAt: existing.expiresAt,
      metadata: existing.metadata,
    });

    // Revoke old key
    await this.revoke(id);

    return { apiKey: newApiKey, key };
  }
}
`;
  }

  private getApiKeyControllerContent(): string {
    return `/**
 * API Key Controller
 *
 * REST endpoints for managing API keys:
 * - POST /api-keys - Create a new API key
 * - GET /api-keys - List API keys
 * - GET /api-keys/:id - Get API key details
 * - PATCH /api-keys/:id - Update API key
 * - DELETE /api-keys/:id - Revoke API key
 * - POST /api-keys/:id/rotate - Rotate API key
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiKeyService } from "./api-key.service";
import type {
  ApiKeyCreateInput,
  ApiKeyUpdateInput,
} from "./types/api-key.types";

// TODO: Replace with actual auth guard
// import { AuthGuard } from "@/auth/guards/auth.guard";

@Controller("api-keys")
// @UseGuards(AuthGuard)
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  /**
   * Create a new API key
   * Returns the key value only once - it cannot be retrieved later
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() input: ApiKeyCreateInput) {
    const result = await this.apiKeyService.create(input);
    return {
      ...result.apiKey,
      key: result.key, // Only returned on creation
    };
  }

  /**
   * List API keys
   * Keys are masked - only prefix is shown
   */
  @Get()
  async list(
    @Query("userId") userId?: string,
    @Query("organizationId") organizationId?: string,
    @Query("isActive") isActive?: string,
  ) {
    return this.apiKeyService.list({
      userId,
      organizationId,
      isActive: isActive !== undefined ? isActive === "true" : undefined,
    });
  }

  /**
   * Get API key details by ID
   */
  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.apiKeyService.findById(id);
  }

  /**
   * Update API key
   */
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() input: ApiKeyUpdateInput,
  ) {
    return this.apiKeyService.update(id, input);
  }

  /**
   * Revoke API key (soft delete)
   */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(@Param("id") id: string) {
    await this.apiKeyService.revoke(id);
  }

  /**
   * Permanently delete API key
   */
  @Delete(":id/permanent")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string) {
    await this.apiKeyService.delete(id);
  }

  /**
   * Rotate API key
   * Creates new key and revokes old one
   */
  @Post(":id/rotate")
  async rotate(@Param("id") id: string) {
    const result = await this.apiKeyService.rotate(id);
    return {
      ...result.apiKey,
      key: result.key, // New key only returned once
    };
  }
}
`;
  }

  private getApiKeyModuleContent(): string {
    return `/**
 * API Key Module
 *
 * NestJS module for API key authentication.
 * Provides:
 * - ApiKeyService for key management
 * - ApiKeyGuard for route protection
 * - ApiKeyController for REST endpoints
 */
import { Module, Global } from "@nestjs/common";
import { ApiKeyService } from "./api-key.service";
import { ApiKeyController } from "./api-key.controller";
import { ApiKeyGuard } from "./guards/api-key.guard";

@Global()
@Module({
  controllers: [ApiKeyController],
  providers: [ApiKeyService, ApiKeyGuard],
  exports: [ApiKeyService, ApiKeyGuard],
})
export class ApiKeyModule {}
`;
  }

  private getApiKeyGuardContent(): string {
    return `/**
 * API Key Guard
 *
 * NestJS guard that validates API keys from request headers.
 * Supports both Authorization header and X-API-Key header.
 *
 * Usage:
 * @UseGuards(ApiKeyGuard)
 * @RequireScopes('read:users', 'write:orders')
 * @Get('/protected')
 * async protectedRoute() { ... }
 *
 * Headers accepted:
 * - Authorization: Bearer sk_live_xxx
 * - X-API-Key: sk_live_xxx
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ApiKeyService } from "../api-key.service";
import { API_KEY_SCOPES_KEY } from "../decorators/api-key.decorator";
import type { ApiKeyScope } from "../types/api-key.types";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract API key from headers
    const apiKey = this.extractApiKey(request);
    if (!apiKey) {
      throw new UnauthorizedException("API key is required");
    }

    // Validate the API key
    const result = await this.apiKeyService.validate(apiKey);
    if (!result.valid) {
      throw new UnauthorizedException(result.reason ?? "Invalid API key");
    }

    // Check required scopes
    const requiredScopes = this.reflector.getAllAndOverride<ApiKeyScope[]>(
      API_KEY_SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredScopes && requiredScopes.length > 0) {
      const hasAllScopes = requiredScopes.every((scope) =>
        this.apiKeyService.hasScope(result.apiKey!, scope),
      );

      if (!hasAllScopes) {
        throw new ForbiddenException(
          \`API key missing required scopes: \${requiredScopes.join(", ")}\`,
        );
      }
    }

    // Attach API key data to request for use in handlers
    request.apiKey = result.apiKey;

    return true;
  }

  /**
   * Extract API key from request headers
   * Supports Authorization: Bearer xxx and X-API-Key: xxx
   */
  private extractApiKey(request: any): string | null {
    // Try Authorization header first
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      // Only accept API keys (starting with sk_)
      if (token.startsWith("sk_")) {
        return token;
      }
    }

    // Try X-API-Key header
    const apiKeyHeader = request.headers["x-api-key"];
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    return null;
  }
}
`;
  }

  private getApiKeyDecoratorContent(): string {
    return `/**
 * API Key Decorators
 *
 * Decorators for API key authentication:
 * - @RequireScopes(...scopes) - Require specific scopes
 * - @ApiKey() - Get current API key from request
 * - @PublicApiKey() - Mark route as requiring API key auth
 */
import { SetMetadata, createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { ApiKeyScope, ApiKey } from "../types/api-key.types";

/**
 * Metadata key for required scopes
 */
export const API_KEY_SCOPES_KEY = "api_key_scopes";

/**
 * Decorator to require specific scopes for an endpoint
 *
 * @example
 * @RequireScopes('read:users', 'write:orders')
 * @Get('/admin/users')
 * async getUsers() { ... }
 */
export const RequireScopes = (...scopes: ApiKeyScope[]) =>
  SetMetadata(API_KEY_SCOPES_KEY, scopes);

/**
 * Parameter decorator to inject the current API key
 *
 * @example
 * @Get('/whoami')
 * async whoami(@ApiKey() apiKey: ApiKeyData) {
 *   return { keyId: apiKey.id, scopes: apiKey.scopes };
 * }
 */
export const CurrentApiKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ApiKey | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.apiKey ?? null;
  },
);

/**
 * Decorator to mark a controller or route as API key protected
 * Use with ApiKeyGuard
 *
 * @example
 * @ApiKeyProtected()
 * @Controller('external-api')
 * export class ExternalApiController { ... }
 */
export const ApiKeyProtected = () => SetMetadata("api_key_protected", true);

/**
 * Common scope presets
 */
export const Scopes = {
  // User operations
  READ_USERS: "read:users" as ApiKeyScope,
  WRITE_USERS: "write:users" as ApiKeyScope,

  // Order operations
  READ_ORDERS: "read:orders" as ApiKeyScope,
  WRITE_ORDERS: "write:orders" as ApiKeyScope,

  // Product operations
  READ_PRODUCTS: "read:products" as ApiKeyScope,
  WRITE_PRODUCTS: "write:products" as ApiKeyScope,

  // Admin operations
  ADMIN: "admin:*" as ApiKeyScope,

  // Full access
  FULL_ACCESS: "*" as ApiKeyScope,
} as const;
`;
  }

  private getApiKeyTypesContent(): string {
    return `/**
 * API Key Types
 *
 * Type definitions for API key authentication system.
 */

/**
 * API Key scope format: "action:resource"
 * Examples: "read:users", "write:orders", "admin:*"
 */
export type ApiKeyScope = string;

/**
 * Rate limit configuration for an API key
 */
export interface ApiKeyRateLimit {
  /** Maximum requests per minute */
  requestsPerMinute: number;
  /** Maximum requests per hour */
  requestsPerHour: number;
  /** Maximum requests per day (optional) */
  requestsPerDay?: number;
}

/**
 * API Key entity
 */
export interface ApiKey {
  /** Unique identifier */
  id: string;

  /** Human-readable name for the key */
  name: string;

  /** First 12 characters of the key (for identification) */
  keyPrefix: string;

  /** Scopes granted to this key */
  scopes: ApiKeyScope[];

  /** Environment (live or test) */
  environment: "live" | "test";

  /** User who owns this key (optional) */
  userId?: string;

  /** Organization that owns this key (optional) */
  organizationId?: string;

  /** Rate limit configuration */
  rateLimit: ApiKeyRateLimit;

  /** Expiration date (null = never expires) */
  expiresAt: Date | null;

  /** Last time the key was used */
  lastUsedAt: Date | null;

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;

  /** Whether the key is active */
  isActive: boolean;

  /** Additional metadata */
  metadata: Record<string, unknown>;
}

/**
 * Input for creating a new API key
 */
export interface ApiKeyCreateInput {
  /** Human-readable name */
  name: string;

  /** Scopes to grant */
  scopes?: ApiKeyScope[];

  /** Environment (defaults to "live") */
  environment?: "live" | "test";

  /** Owner user ID */
  userId?: string;

  /** Owner organization ID */
  organizationId?: string;

  /** Rate limit configuration */
  rateLimit?: ApiKeyRateLimit;

  /** Expiration date */
  expiresAt?: Date | null;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Input for updating an API key
 */
export interface ApiKeyUpdateInput {
  /** Update name */
  name?: string;

  /** Update scopes */
  scopes?: ApiKeyScope[];

  /** Update rate limit */
  rateLimit?: ApiKeyRateLimit;

  /** Update expiration */
  expiresAt?: Date | null;

  /** Enable/disable key */
  isActive?: boolean;

  /** Merge additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Result of API key validation
 */
export interface ApiKeyValidationResult {
  /** Whether the key is valid */
  valid: boolean;

  /** API key data (if valid) */
  apiKey?: ApiKey;

  /** Reason for invalid key */
  reason?: string;
}

/**
 * API key with usage statistics
 */
export interface ApiKeyWithStats extends ApiKey {
  /** Total requests made with this key */
  totalRequests: number;

  /** Requests in current period */
  currentPeriodRequests: number;

  /** Usage by endpoint */
  endpointUsage: Record<string, number>;
}
`;
  }

  private getApiKeyIndexContent(): string {
    return `/**
 * API Key Module Exports
 */
export * from "./api-key.service";
export * from "./api-key.controller";
export * from "./api-key.module";
export * from "./guards/api-key.guard";
export * from "./decorators/api-key.decorator";
export * from "./types/api-key.types";
`;
  }

  private getApiKeySchemaContent(): string {
    return `/**
 * API Keys Database Schema (Drizzle ORM)
 *
 * Schema for storing API keys with:
 * - Hashed key storage (never store plain keys)
 * - Scope-based permissions
 * - Rate limiting configuration
 * - Audit trail (created, updated, last used)
 */
import { pgTable, text, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

/**
 * API Keys table
 */
export const apiKeys = pgTable("api_keys", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  /** Human-readable name */
  name: text("name").notNull(),

  /** First 12 chars of key for identification */
  keyPrefix: text("key_prefix").notNull(),

  /** SHA-256 hash of the full key */
  hashedKey: text("hashed_key").notNull().unique(),

  /** JSON array of scopes */
  scopes: jsonb("scopes").$type<string[]>().notNull().default([]),

  /** live or test */
  environment: text("environment").notNull().default("live"),

  /** Owner user ID */
  userId: text("user_id"),

  /** Owner organization ID */
  organizationId: text("organization_id"),

  /** Rate limit: requests per minute */
  rateLimitPerMinute: integer("rate_limit_per_minute").notNull().default(60),

  /** Rate limit: requests per hour */
  rateLimitPerHour: integer("rate_limit_per_hour").notNull().default(1000),

  /** Rate limit: requests per day */
  rateLimitPerDay: integer("rate_limit_per_day"),

  /** Expiration timestamp */
  expiresAt: timestamp("expires_at", { mode: "date" }),

  /** Last usage timestamp */
  lastUsedAt: timestamp("last_used_at", { mode: "date" }),

  /** Whether the key is active */
  isActive: boolean("is_active").notNull().default(true),

  /** Additional metadata */
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

  /** Creation timestamp */
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),

  /** Update timestamp */
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

/**
 * API Key usage logs for analytics
 */
export const apiKeyUsageLogs = pgTable("api_key_usage_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),

  /** Reference to API key */
  apiKeyId: text("api_key_id")
    .notNull()
    .references(() => apiKeys.id, { onDelete: "cascade" }),

  /** HTTP method */
  method: text("method").notNull(),

  /** Request path */
  path: text("path").notNull(),

  /** Response status code */
  statusCode: integer("status_code"),

  /** Request IP address */
  ipAddress: text("ip_address"),

  /** User agent */
  userAgent: text("user_agent"),

  /** Response time in ms */
  responseTimeMs: integer("response_time_ms"),

  /** Timestamp */
  timestamp: timestamp("timestamp", { mode: "date" }).notNull().defaultNow(),
});

/**
 * Type exports for Drizzle
 */
export type ApiKeyRecord = typeof apiKeys.$inferSelect;
export type NewApiKeyRecord = typeof apiKeys.$inferInsert;
export type ApiKeyUsageLogRecord = typeof apiKeyUsageLogs.$inferSelect;
export type NewApiKeyUsageLogRecord = typeof apiKeyUsageLogs.$inferInsert;
`;
  }

  private getApiKeyContractContent(): string {
    return `/**
 * API Keys ORPC Contract
 *
 * Type-safe API contract for API key management endpoints.
 */
import { z } from "zod";
import { oc } from "@orpc/contract";

/**
 * API Key scope schema
 */
const apiKeyScopeSchema = z.string();

/**
 * Rate limit schema
 */
const rateLimitSchema = z.object({
  requestsPerMinute: z.number().int().positive(),
  requestsPerHour: z.number().int().positive(),
  requestsPerDay: z.number().int().positive().optional(),
});

/**
 * API Key schema (without sensitive data)
 */
const apiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  keyPrefix: z.string(),
  scopes: z.array(apiKeyScopeSchema),
  environment: z.enum(["live", "test"]),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  rateLimit: rateLimitSchema,
  expiresAt: z.date().nullable(),
  lastUsedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean(),
  metadata: z.record(z.unknown()),
});

/**
 * API Key with full key (only returned on creation)
 */
const apiKeyWithKeySchema = apiKeySchema.extend({
  key: z.string(),
});

/**
 * Create API key input
 */
const createApiKeyInput = z.object({
  name: z.string().min(1).max(255),
  scopes: z.array(apiKeyScopeSchema).optional(),
  environment: z.enum(["live", "test"]).optional(),
  rateLimit: rateLimitSchema.optional(),
  expiresAt: z.date().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Update API key input
 */
const updateApiKeyInput = z.object({
  name: z.string().min(1).max(255).optional(),
  scopes: z.array(apiKeyScopeSchema).optional(),
  rateLimit: rateLimitSchema.optional(),
  expiresAt: z.date().nullable().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * List API keys query
 */
const listApiKeysQuery = z.object({
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * API Keys contract
 */
export const apiKeysContract = oc.router({
  /**
   * Create a new API key
   */
  create: oc
    .input(createApiKeyInput)
    .output(apiKeyWithKeySchema),

  /**
   * List API keys
   */
  list: oc
    .input(listApiKeysQuery)
    .output(z.array(apiKeySchema)),

  /**
   * Get API key by ID
   */
  getById: oc
    .input(z.object({ id: z.string() }))
    .output(apiKeySchema.nullable()),

  /**
   * Update API key
   */
  update: oc
    .input(z.object({ id: z.string() }).merge(updateApiKeyInput))
    .output(apiKeySchema),

  /**
   * Revoke API key
   */
  revoke: oc
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() })),

  /**
   * Delete API key permanently
   */
  delete: oc
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean() })),

  /**
   * Rotate API key
   */
  rotate: oc
    .input(z.object({ id: z.string() }))
    .output(apiKeyWithKeySchema),
});

/**
 * Type exports
 */
export type ApiKeysContract = typeof apiKeysContract;
export type ApiKey = z.infer<typeof apiKeySchema>;
export type ApiKeyWithKey = z.infer<typeof apiKeyWithKeySchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeyInput>;
export type UpdateApiKeyInput = z.infer<typeof updateApiKeyInput>;
export type ListApiKeysQuery = z.infer<typeof listApiKeysQuery>;
`;
  }

  private getApiKeyContractIndexContent(): string {
    return `/**
 * API Keys Contract Exports
 */
export * from "./api-keys.contract";
`;
  }

  private getEnvExampleContent(): string {
    return `# API Key Authentication Configuration
# Copy to .env and configure

# API Key prefix (used for identifying key type)
# Default: sk (secret key)
API_KEY_PREFIX=sk

# Default rate limits for new API keys
API_KEY_DEFAULT_RATE_LIMIT_PER_MINUTE=60
API_KEY_DEFAULT_RATE_LIMIT_PER_HOUR=1000
API_KEY_DEFAULT_RATE_LIMIT_PER_DAY=10000

# API key hash algorithm (sha256 recommended)
API_KEY_HASH_ALGORITHM=sha256

# Enable API key usage logging
API_KEY_ENABLE_USAGE_LOGGING=true

# Log retention in days (0 = forever)
API_KEY_LOG_RETENTION_DAYS=90
`;
  }
}
