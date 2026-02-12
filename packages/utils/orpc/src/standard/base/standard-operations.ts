/**
 * Standard Operations - Abstract Base
 *
 * Light abstract base class that defines the contract for all entity operations.
 * Concrete implementations (Zod, Valibot, etc.) must implement every method
 * using their chosen validation library.
 *
 * This base provides:
 * - Shared state (entitySchema, entityName, idField, etc.)
 * - Protected `createBuilder()` for RouteBuilder instantiation
 * - Abstract method declarations for all operations
 *
 * It does NOT use any schema factory (s.*, z.*, etc.) — that's the job
 * of concrete implementations.
 */

import type { AnySchema } from "@orpc/contract";
import { RouteBuilder } from "../../builder/route-builder";
import type { EntitySchema, SchemaWithConfig } from "./types";
import type { VoidSchema } from "../../builder/standard-schema-helpers";
import type { UUIDSchema } from "./types";
import type { FieldFilterConfig } from "./utils";

/**
 * Options for entity operations
 *
 * @typeParam TEntitySchema - The entity's schema type
 * @typeParam TIdField - The ID field name literal (default: "id")
 * @typeParam TIdSchema - The ID schema type (default: UUIDSchema)
 */
export type EntityOperationOptions<TEntitySchema extends EntitySchema, TIdField extends string = "id", TIdSchema extends AnySchema = UUIDSchema> = {
    entitySchema: TEntitySchema;
    entityName: string;
    idField?: TIdField;
    idSchema?: TIdSchema;
    timestamps?: boolean;
    softDelete?: boolean;
};

/**
 * Options for list operations using config schemas
 */
export type ListOperationOptions = {
    pagination?: SchemaWithConfig<unknown>;
    sorting?: SchemaWithConfig<unknown>;
    filtering?: SchemaWithConfig<unknown>;
    search?: SchemaWithConfig<unknown>;
};

/**
 * Plain options for list operations (alternative API)
 */
export type ListPlainOptions = {
    pagination?: {
        defaultLimit?: number;
        maxLimit?: number;
        includeOffset?: boolean;
        includeCursor?: boolean;
        includePage?: boolean;
    };
    sorting?: {
        fields: readonly string[];
        defaultField?: string;
        defaultDirection?: "asc" | "desc";
    };
    filtering?: {
        fields: Record<string, FieldFilterConfig>;
        allowLogicalOperators?: boolean;
    };
    search?: {
        fields?: readonly string[];
        minQueryLength?: number;
    };
};

/**
 * Abstract Standard Operations class
 *
 * Defines the contract for all entity operations.
 * Concrete implementations must implement every abstract method
 * using their chosen validation library (Zod, Valibot, Arktype, etc.).
 *
 * The base holds shared state and a `createBuilder()` helper,
 * but delegates all schema construction to implementations.
 *
 * @typeParam TEntity - The entity schema type
 * @typeParam TIdField - The ID field name literal (default: "id")
 * @typeParam TIdSchema - The ID schema type (default: UUIDSchema)
 *
 * @example
 * ```typescript
 * // Zod implementation
 * class ZodStandardOperations<TEntity extends z.ZodObject<z.ZodRawShape>>
 *   extends StandardOperations<TEntity> {
 *
 *   protected getDefaultIdSchema() { return z.uuid(); }
 *
 *   read(options?) {
 *     return this.createBuilder({ method: "GET" })
 *       .path("/{id}")
 *       .input(z.object({ id: z.uuid() }))
 *       .output(this.entitySchema);
 *   }
 *   // ... implement all methods
 * }
 * ```
 */
export abstract class StandardOperations<TEntity extends EntitySchema = EntitySchema, TIdField extends string = "id", TIdSchema extends AnySchema = UUIDSchema> {
    protected entitySchema: TEntity;
    protected entityName: string;
    protected idField: TIdField;
    protected idSchema: TIdSchema;
    protected hasTimestamps: boolean;
    protected hasSoftDelete: boolean;

    constructor(options: EntityOperationOptions<TEntity, TIdField, TIdSchema>) {
        this.entitySchema = options.entitySchema;
        this.entityName = options.entityName;
        this.idField = (options.idField ?? "id") as TIdField;
        this.idSchema = options.idSchema ?? this.getDefaultIdSchema();
        this.hasTimestamps = options.timestamps ?? true;
        this.hasSoftDelete = options.softDelete ?? false;
    }

    /**
     * Get the default ID schema when none is provided.
     * Implementations must return a UUID schema or equivalent for their library.
     */
    protected abstract getDefaultIdSchema(): TIdSchema;

    /**
     * Create a RouteBuilder with minimal initial configuration.
     * Shared across all implementations — RouteBuilder is library-agnostic.
     */
    protected createBuilder<TMethod extends "GET" | "POST" | "PUT" | "PATCH" | "DELETE">(metadata: { method: TMethod; summary?: string; description?: string }): RouteBuilder<VoidSchema, VoidSchema, TMethod, TEntity> {
        return new RouteBuilder<VoidSchema, VoidSchema, TMethod, TEntity, Record<string, never>>({
            entitySchema: this.entitySchema,
            method: metadata.method,
            metadata: {
                summary: metadata.summary,
                description: metadata.description,
            },
        });
    }

    // ==================== CRUD Operations ====================

    /** Read a single entity by ID (GET /{id}) */
    abstract read(options?: { idSchema?: AnySchema; idFieldName?: string }): unknown;

    /** Create a new entity (POST /) */
    abstract create(options?: { bodySchema?: AnySchema }): unknown;

    /** Full update of an entity (PUT /{id}) */
    abstract update(options?: { idSchema?: AnySchema; idFieldName?: string; bodySchema?: AnySchema }): unknown;

    /** Partial update of an entity (PATCH /{id}) */
    abstract patch(options?: { idSchema?: AnySchema; idFieldName?: string; bodySchema?: AnySchema }): unknown;

    /** Delete an entity (DELETE /{id}) */
    abstract delete(options?: { idSchema?: AnySchema; idFieldName?: string }): unknown;

    // ==================== List Operations ====================

    /** List entities with pagination, sorting, filtering, and search */
    abstract list(options?: ListOperationOptions | ListPlainOptions): unknown;

    // ==================== Batch Operations ====================

    /** Batch create multiple entities (POST /batch) */
    abstract batchCreate(options?: { maxBatchSize?: number; itemSchema?: AnySchema }): unknown;

    /** Batch delete multiple entities (DELETE /batch) */
    abstract batchDelete(options?: { maxBatchSize?: number; idSchema?: AnySchema }): unknown;

    /** Batch read multiple entities by IDs (POST /batch/read) */
    abstract batchRead(options?: { maxBatchSize?: number; idSchema?: AnySchema }): unknown;

    /** Batch update multiple entities (PATCH /batch) */
    abstract batchUpdate(options?: { maxBatchSize?: number }): unknown;

    /** Batch upsert (create or update) multiple entities (PUT /batch/upsert) */
    abstract batchUpsert(options?: { maxBatchSize?: number; uniqueField?: string }): unknown;

    // ==================== Utility Operations ====================

    /** Count entities with optional filtering */
    abstract count(options?: { filtering?: SchemaWithConfig<unknown> }): unknown;

    /** Full-text search with pagination */
    abstract search(options?: { searchFields?: readonly string[]; pagination?: SchemaWithConfig<unknown> | { defaultLimit?: number; maxLimit?: number } }): unknown;

    /** Check if an entity exists with a given field value */
    abstract check(fieldName: string, fieldSchema?: AnySchema): unknown;

    /** Check if an entity exists by ID */
    abstract exists(options?: { idSchema?: AnySchema; idFieldName?: string }): unknown;

    /** Upsert (create or update) a single entity */
    abstract upsert(options?: { uniqueField?: string; path?: string }): unknown;

    /** Validate entity data without persisting */
    abstract validate(options?: { bodySchema?: AnySchema }): unknown;

    // ==================== Soft Delete Operations ====================

    /** Soft delete an entity (mark as deleted) */
    abstract softDelete(options?: { pathSuffix?: string; idSchema?: AnySchema; idFieldName?: string }): unknown;

    /** Batch soft delete multiple entities */
    abstract batchSoftDelete(options?: { pathSuffix?: string; maxBatchSize?: number; idSchema?: AnySchema }): unknown;

    /** Archive an entity (soft delete alias) */
    abstract archive(options?: { idSchema?: AnySchema; idFieldName?: string }): unknown;

    /** Restore a soft-deleted entity */
    abstract restore(options?: { idSchema?: AnySchema; idFieldName?: string }): unknown;

    // ==================== Advanced Operations ====================

    /** Clone (duplicate) an entity */
    abstract clone(options?: { idSchema?: AnySchema; idFieldName?: string }): unknown;

    /** Get change history for an entity */
    abstract history(options?: { idSchema?: AnySchema; idFieldName?: string }): unknown;

    /** Get distinct values for a field */
    abstract distinct(fieldName: string): unknown;

    /** Aggregate operations (sum, avg, min, max, count) */
    abstract aggregate(options?: { functions?: Record<string, { op: "sum" | "avg" | "min" | "max" | "count"; field: string }>; groupBy?: readonly string[]; path?: string }): unknown;

    /** Export entities in various formats */
    abstract export(options?: { formats?: readonly string[]; path?: string }): unknown;

    /** Import entities from file */
    abstract import(options?: { formats?: readonly string[]; maxRecords?: number; path?: string }): unknown;

    /** Health check endpoint */
    abstract healthCheck(options?: { includeDependencies?: boolean; path?: string }): unknown;

    /** Service metrics endpoint */
    abstract metrics(options?: { format?: "json" | "prometheus"; path?: string }): unknown;

    // ==================== Streaming Operations ====================

    /** Streaming read with real-time updates (EventIterator output) */
    abstract streamingRead(options?: { idSchema?: AnySchema; idFieldName?: string }): unknown;

    /** Streaming list with real-time updates (EventIterator output) */
    abstract streamingList(options?: ListOperationOptions | (ListPlainOptions & { path?: string })): unknown;

    /** Streaming search with real-time updates (EventIterator output) */
    abstract streamingSearch(options?: { searchFields?: readonly string[]; pagination?: SchemaWithConfig<unknown> | { defaultLimit?: number; maxLimit?: number } }): unknown;

    /** Streamed input operation (EventIterator input, normal output) */
    abstract streamedInput(options?: { chunkSchema?: AnySchema; path?: string; outputSchema?: AnySchema }): unknown;

    /** WebSocket / bidirectional streaming (EventIterator both directions) */
    abstract websocket(options?: { inputChunkSchema?: AnySchema; outputChunkSchema?: AnySchema; path?: string }): unknown;

    /** Alias for websocket() */
    abstract bidirectional(options?: { inputChunkSchema?: AnySchema; outputChunkSchema?: AnySchema; path?: string }): unknown;

    /** File streaming with HTTP Range header support */
    abstract streamFile(options?: { idSchema?: AnySchema; idFieldName?: string; path?: string }): unknown;
}
