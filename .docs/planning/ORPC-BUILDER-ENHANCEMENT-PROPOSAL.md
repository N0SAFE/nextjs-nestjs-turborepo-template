# ORPC Builder Enhancement Proposal

## Overview

This document outlines proposed enhancements to the ORPC contract builder system to maximize coverage of common API patterns. The proposal is divided into two main areas:

1. **StandardOperations Enhancements** - New methods for entity-based CRUD patterns
2. **RouteBuilder Static Methods** - Non-entity patterns for general API building

---

## Part 1: StandardOperations New Methods

### Current Methods (Already Implemented)

| Method | HTTP | Description |
|--------|------|-------------|
| `read()` | GET /{id} | Get entity by ID |
| `streamingRead()` | GET /{id}/streaming | Real-time entity subscription |
| `create()` | POST / | Create new entity |
| `update()` | PUT /{id} | Full entity update |
| `patch()` | PATCH /{id} | Partial entity update |
| `delete()` | DELETE /{id} | Delete entity by ID |
| `list()` | GET / | Paginated list with filtering/sorting |
| `streamingList()` | GET /streaming | Real-time list subscription |
| `count()` | GET /count | Total entity count |
| `search()` | GET /search | Full-text search |
| `check()` | GET /check/{field} | Check if field value exists |
| `batchCreate()` | POST /batch | Create multiple entities |
| `batchDelete()` | DELETE /batch | Delete multiple entities |

### Proposed New Methods

#### 1. Batch Operations

```typescript
/**
 * Batch READ operation - Get multiple entities by IDs
 * GET /batch or POST /batch/read (for large ID lists)
 */
batchRead(options?: { maxBatchSize?: number }): RouteBuilder<
  z.ZodObject<{ ids: z.ZodArray<z.ZodUUID> }>,
  z.ZodObject<{
    items: z.ZodArray<TEntity>;
    notFound: z.ZodOptional<z.ZodArray<z.ZodString>>;
  }>
>

/**
 * Batch UPDATE operation - Update multiple entities
 * PATCH /batch
 */
batchUpdate(options?: { maxBatchSize?: number }): RouteBuilder<
  z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{ id: z.ZodUUID } & Partial<TEntity>>>
  }>,
  z.ZodObject<{
    items: z.ZodArray<TEntity>;
    errors: z.ZodOptional<z.ZodArray<z.ZodObject<{ id: z.ZodString; error: z.ZodString }>>>;
  }>
>
```

#### 2. Existence & Validation

```typescript
/**
 * Check if entity exists by ID
 * GET /{id}/exists
 */
exists(): RouteBuilder<
  z.ZodObject<{ id: z.ZodUUID }>,
  z.ZodObject<{ exists: z.ZodBoolean }>
>

/**
 * Validate entity data without persisting
 * POST /validate
 */
validate(): RouteBuilder<
  TEntity,
  z.ZodObject<{
    valid: z.ZodBoolean;
    errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
      field: z.ZodString;
      message: z.ZodString;
    }>>>;
  }>
>
```

#### 3. Upsert Operations

```typescript
/**
 * Create or Update entity (upsert by ID or unique field)
 * PUT / or PUT /{id}
 */
upsert(options?: { 
  uniqueField?: keyof TEntity;
}): RouteBuilder<TEntity, TEntity>

/**
 * Batch upsert - Create or update multiple entities
 * PUT /batch
 */
batchUpsert(options?: { 
  maxBatchSize?: number;
  uniqueField?: keyof TEntity;
}): RouteBuilder<
  z.ZodObject<{ items: z.ZodArray<TEntity> }>,
  z.ZodObject<{
    created: z.ZodArray<TEntity>;
    updated: z.ZodArray<TEntity>;
    errors: z.ZodOptional<z.ZodArray<z.ZodObject<{ index: z.ZodNumber; error: z.ZodString }>>>;
  }>
>
```

#### 4. Soft Delete (Archive) Pattern

```typescript
/**
 * Soft delete (archive) entity
 * POST /{id}/archive or PATCH /{id} with status
 */
archive(): RouteBuilder<
  z.ZodObject<{ id: z.ZodUUID }>,
  z.ZodObject<{ success: z.ZodBoolean; archivedAt: z.ZodDate }>
>

/**
 * Restore soft-deleted entity
 * POST /{id}/restore
 */
restore(): RouteBuilder<
  z.ZodObject<{ id: z.ZodUUID }>,
  TEntity
>

/**
 * List archived entities
 * GET /archived
 */
listArchived(options?: QueryConfig): RouteBuilder<...>
```

#### 5. Clone/Duplicate

```typescript
/**
 * Clone/duplicate an entity
 * POST /{id}/clone
 */
clone(options?: {
  excludeFields?: (keyof TEntity)[];
}): RouteBuilder<
  z.ZodObject<{ 
    id: z.ZodUUID;
    overrides: z.ZodOptional<z.ZodPartial<TEntity>>;
  }>,
  TEntity
>
```

#### 6. History/Audit Trail

```typescript
/**
 * Get change history for an entity
 * GET /{id}/history
 */
history(options?: {
  pagination?: PaginationConfig;
}): RouteBuilder<
  z.ZodObject<{ id: z.ZodUUID; limit?: z.ZodNumber; cursor?: z.ZodString }>,
  z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
      id: z.ZodString;
      entityId: z.ZodString;
      action: z.ZodEnum<['created', 'updated', 'deleted', 'restored']>;
      changes: z.ZodRecord<z.ZodString, z.ZodObject<{ old: z.ZodAny; new: z.ZodAny }>>;
      userId: z.ZodOptional<z.ZodString>;
      timestamp: z.ZodDate;
    }>>;
    pagination: PaginationOutput;
  }>
>

/**
 * Get entity at specific point in time
 * GET /{id}/at/{timestamp}
 */
snapshot(options?: {}): RouteBuilder<
  z.ZodObject<{ id: z.ZodUUID; timestamp: z.ZodDate }>,
  z.ZodNullable<TEntity>
>
```

#### 7. Aggregation

```typescript
/**
 * Aggregate data (count, sum, avg, min, max, group by)
 * GET /aggregate
 */
aggregate<TFields extends (keyof TEntity)[]>(options: {
  operations: ('count' | 'sum' | 'avg' | 'min' | 'max')[];
  fields?: TFields;
  groupBy?: (keyof TEntity)[];
}): RouteBuilder<
  z.ZodObject<{
    filters?: FilteringInput;
    groupBy?: z.ZodArray<z.ZodString>;
  }>,
  z.ZodObject<{
    results: z.ZodArray<z.ZodObject<{
      group?: z.ZodRecord<z.ZodString, z.ZodAny>;
      count?: z.ZodNumber;
      sum?: z.ZodRecord<z.ZodString, z.ZodNumber>;
      avg?: z.ZodRecord<z.ZodString, z.ZodNumber>;
      min?: z.ZodRecord<z.ZodString, z.ZodAny>;
      max?: z.ZodRecord<z.ZodString, z.ZodAny>;
    }>>;
  }>
>

/**
 * Get distinct values for a field
 * GET /distinct/{field}
 */
distinct<TField extends keyof TEntity>(
  fieldName: TField
): RouteBuilder<
  z.ZodObject<{ limit?: z.ZodNumber }>,
  z.ZodObject<{
    values: z.ZodArray<z.ZodType<TEntity[TField]>>;
    total: z.ZodNumber;
  }>
>
```

#### 8. Relationship Operations

```typescript
/**
 * Add relation to another entity
 * POST /{id}/relations/{relationName}
 */
addRelation<TRelated extends z.ZodTypeAny>(
  relationName: string,
  relatedIdSchema?: z.ZodTypeAny
): RouteBuilder<
  z.ZodObject<{ id: z.ZodUUID; relatedId: z.ZodUUID }>,
  z.ZodObject<{ success: z.ZodBoolean }>
>

/**
 * Remove relation from another entity
 * DELETE /{id}/relations/{relationName}/{relatedId}
 */
removeRelation(
  relationName: string
): RouteBuilder<
  z.ZodObject<{ id: z.ZodUUID; relatedId: z.ZodUUID }>,
  z.ZodObject<{ success: z.ZodBoolean }>
>

/**
 * Get related entities
 * GET /{id}/relations/{relationName}
 */
getRelations<TRelated extends z.ZodTypeAny>(
  relationName: string,
  relatedSchema: TRelated,
  options?: QueryConfig
): RouteBuilder<
  z.ZodObject<{ id: z.ZodUUID; ...pagination }>,
  z.ZodObject<{ items: z.ZodArray<TRelated>; pagination: ... }>
>
```

#### 9. Import/Export

```typescript
/**
 * Export entities to various formats
 * GET /export or POST /export (for complex filters)
 */
export(options?: {
  formats?: ('json' | 'csv' | 'xlsx')[];
}): RouteBuilder<
  z.ZodObject<{
    format: z.ZodEnum<['json', 'csv', 'xlsx']>;
    filters?: FilteringInput;
  }>,
  z.ZodUnion<[z.ZodArray<TEntity>, z.ZodFile]>
>

/**
 * Import entities from file
 * POST /import
 */
import(options?: {
  formats?: ('json' | 'csv' | 'xlsx')[];
  maxItems?: number;
}): RouteBuilder<
  z.ZodObject<{
    file: z.ZodFile;
    format: z.ZodOptional<z.ZodEnum<['json', 'csv', 'xlsx']>>;
    skipValidation?: z.ZodBoolean;
  }>,
  z.ZodObject<{
    imported: z.ZodNumber;
    errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
      row: z.ZodNumber;
      error: z.ZodString;
    }>>>;
  }>
>
```

#### 10. Streaming Variants

```typescript
/**
 * Streaming search results
 * GET /search/streaming
 */
streamingSearch(options?: SearchOptions): RouteBuilder<..., ..., undefined, EventIteratorWrapper>

/**
 * Stream changes (CDC - Change Data Capture)
 * GET /changes/stream
 */
streamChanges(): RouteBuilder<
  z.ZodObject<{ since?: z.ZodDate }>,
  z.ZodObject<{
    action: z.ZodEnum<['created', 'updated', 'deleted']>;
    entity: TEntity;
    timestamp: z.ZodDate;
  }>,
  undefined,
  EventIteratorWrapper
>
```

---

## Part 2: RouteBuilder Static Methods

These are **non-entity patterns** - utility contract builders that don't require an entity schema.

### Design Philosophy

Static methods on `RouteBuilder` provide reusable contract patterns for common API scenarios that aren't tied to a specific entity. These are building blocks for APIs like:
- Health checks
- Configuration endpoints
- Action triggers
- File operations
- Generic streaming
- Webhook receivers

### Proposed Static Methods

#### 1. Health & Status

```typescript
/**
 * Health check endpoint
 * GET /health
 */
static health(options?: {
  path?: string;
  includeDetails?: boolean;
}): RouteBuilder<
  z.ZodVoid,
  z.ZodObject<{
    status: z.ZodEnum<['healthy', 'degraded', 'unhealthy']>;
    timestamp: z.ZodDate;
    details?: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
      status: z.ZodEnum<['up', 'down']>;
      latency?: z.ZodNumber;
      message?: z.ZodString;
    }>>>;
  }>
>

/**
 * Readiness probe (Kubernetes-style)
 * GET /ready
 */
static ready(options?: { path?: string }): RouteBuilder<
  z.ZodVoid,
  z.ZodObject<{ ready: z.ZodBoolean; reason?: z.ZodString }>
>

/**
 * Liveness probe
 * GET /live
 */
static live(options?: { path?: string }): RouteBuilder<
  z.ZodVoid,
  z.ZodObject<{ alive: z.ZodBoolean }>
>
```

#### 2. Configuration & Settings

```typescript
/**
 * Get configuration/settings
 * GET /config or GET /settings
 */
static config<TConfig extends z.ZodTypeAny>(
  configSchema: TConfig,
  options?: { path?: string }
): RouteBuilder<z.ZodVoid, TConfig>

/**
 * Update configuration
 * PUT /config or PATCH /config
 */
static updateConfig<TConfig extends z.ZodTypeAny>(
  configSchema: TConfig,
  options?: { path?: string; partial?: boolean }
): RouteBuilder<TConfig | z.ZodPartial<TConfig>, TConfig>
```

#### 3. Generic CRUD (Non-Entity)

```typescript
/**
 * Generic paginated list for any output schema
 * GET with pagination, sorting, filtering
 */
static paginatedList<TItem extends z.ZodTypeAny>(
  itemSchema: TItem,
  options?: {
    name?: string;
    path?: string;
    pagination?: PaginationConfig;
    sorting?: SortingConfig;
  }
): RouteBuilder<
  PaginationInput & SortingInput,
  z.ZodObject<{ items: z.ZodArray<TItem>; pagination: ... }>
>

/**
 * Generic streaming list
 */
static streamingPaginatedList<TItem extends z.ZodTypeAny>(
  itemSchema: TItem,
  options?: { ... }
): RouteBuilder<..., ..., undefined, EventIteratorWrapper>

/**
 * Generic check/exists endpoint
 * GET /check
 */
static checkExists<TInput extends z.ZodTypeAny>(
  inputSchema: TInput,
  options?: { path?: string; name?: string }
): RouteBuilder<TInput, z.ZodObject<{ exists: z.ZodBoolean }>>
```

#### 4. Action Patterns

```typescript
/**
 * Generic action trigger (fire-and-forget or sync)
 * POST /actions/{name}
 */
static action<TInput extends z.ZodTypeAny, TOutput extends z.ZodTypeAny>(
  name: string,
  inputSchema: TInput,
  outputSchema: TOutput,
  options?: { async?: boolean }
): RouteBuilder<TInput, TOutput>

/**
 * Async job trigger with job ID response
 * POST /jobs/{name}
 */
static triggerJob<TInput extends z.ZodTypeAny>(
  name: string,
  inputSchema: TInput,
  options?: { path?: string }
): RouteBuilder<
  TInput,
  z.ZodObject<{
    jobId: z.ZodString;
    status: z.ZodEnum<['queued', 'processing']>;
    estimatedTime?: z.ZodNumber;
  }>
>

/**
 * Check job status
 * GET /jobs/{jobId}/status
 */
static jobStatus<TResult extends z.ZodTypeAny>(
  resultSchema: TResult,
  options?: { path?: string }
): RouteBuilder<
  z.ZodObject<{ jobId: z.ZodString }>,
  z.ZodObject<{
    jobId: z.ZodString;
    status: z.ZodEnum<['queued', 'processing', 'completed', 'failed']>;
    progress?: z.ZodNumber;
    result?: TResult;
    error?: z.ZodString;
  }>
>

/**
 * Stream job progress
 * GET /jobs/{jobId}/stream
 */
static streamJobProgress<TResult extends z.ZodTypeAny>(
  resultSchema: TResult
): RouteBuilder<
  z.ZodObject<{ jobId: z.ZodString }>,
  z.ZodObject<{ progress: z.ZodNumber; message?: z.ZodString; result?: TResult }>,
  undefined,
  EventIteratorWrapper
>
```

#### 5. File Operations

```typescript
/**
 * File upload endpoint
 * POST /upload
 */
static upload(options?: {
  path?: string;
  maxSize?: number;
  allowedTypes?: string[];
  multiple?: boolean;
}): RouteBuilder<
  z.ZodObject<{
    file: z.ZodFile | z.ZodArray<z.ZodFile>;
    metadata?: z.ZodRecord<z.ZodString, z.ZodString>;
  }>,
  z.ZodObject<{
    id: z.ZodString;
    filename: z.ZodString;
    size: z.ZodNumber;
    mimeType: z.ZodString;
    url: z.ZodString;
  }> | z.ZodArray<...>
>

/**
 * File download endpoint
 * GET /download/{id}
 */
static download(options?: {
  path?: string;
}): RouteBuilder<
  z.ZodObject<{ id: z.ZodString }>,
  z.ZodFile
>

/**
 * Presigned URL for upload
 * POST /upload/presign
 */
static presignedUpload(options?: {}): RouteBuilder<
  z.ZodObject<{
    filename: z.ZodString;
    contentType: z.ZodString;
    size: z.ZodNumber;
  }>,
  z.ZodObject<{
    uploadUrl: z.ZodString;
    fileId: z.ZodString;
    expiresAt: z.ZodDate;
  }>
>
```

#### 6. Webhook Patterns

```typescript
/**
 * Webhook receiver endpoint
 * POST /webhooks/{source}
 */
static webhook<TPayload extends z.ZodTypeAny>(
  source: string,
  payloadSchema: TPayload,
  options?: {
    path?: string;
    verifySignature?: boolean;
  }
): RouteBuilder<
  z.ZodObject<{
    payload: TPayload;
    headers?: z.ZodRecord<z.ZodString, z.ZodString>;
    signature?: z.ZodString;
  }>,
  z.ZodObject<{ received: z.ZodBoolean; id?: z.ZodString }>
>

/**
 * Webhook registration
 * POST /webhooks
 */
static registerWebhook(): RouteBuilder<
  z.ZodObject<{
    url: z.ZodString;
    events: z.ZodArray<z.ZodString>;
    secret?: z.ZodString;
  }>,
  z.ZodObject<{
    id: z.ZodString;
    secret: z.ZodString;
    createdAt: z.ZodDate;
  }>
>
```

#### 7. Metrics & Analytics

```typescript
/**
 * Metrics endpoint (Prometheus-style)
 * GET /metrics
 */
static metrics(options?: {
  path?: string;
  format?: 'prometheus' | 'json';
}): RouteBuilder<
  z.ZodVoid,
  z.ZodString | z.ZodRecord<z.ZodString, z.ZodNumber>
>

/**
 * Analytics query endpoint
 * POST /analytics
 */
static analytics<TResult extends z.ZodTypeAny>(
  resultSchema: TResult,
  options?: { path?: string }
): RouteBuilder<
  z.ZodObject<{
    metrics: z.ZodArray<z.ZodString>;
    dimensions?: z.ZodArray<z.ZodString>;
    filters?: z.ZodRecord<z.ZodString, z.ZodAny>;
    dateRange: z.ZodObject<{ start: z.ZodDate; end: z.ZodDate }>;
    granularity?: z.ZodEnum<['minute', 'hour', 'day', 'week', 'month']>;
  }>,
  TResult
>
```

#### 8. Real-time Subscriptions

```typescript
/**
 * Generic event subscription
 * GET /subscribe/{channel}
 */
static subscribe<TEvent extends z.ZodTypeAny>(
  eventSchema: TEvent,
  options?: { path?: string }
): RouteBuilder<
  z.ZodObject<{ channel: z.ZodString; filters?: z.ZodRecord<z.ZodString, z.ZodAny> }>,
  TEvent,
  undefined,
  EventIteratorWrapper
>

/**
 * Pub/sub publish endpoint
 * POST /publish/{channel}
 */
static publish<TEvent extends z.ZodTypeAny>(
  eventSchema: TEvent,
  options?: { path?: string }
): RouteBuilder<
  z.ZodObject<{ channel: z.ZodString; event: TEvent }>,
  z.ZodObject<{ published: z.ZodBoolean; recipients?: z.ZodNumber }>
>
```

#### 9. RPC-Style Endpoints

```typescript
/**
 * Generic RPC-style endpoint (for operations that don't fit REST)
 * POST /rpc/{method}
 */
static rpc<TInput extends z.ZodTypeAny, TOutput extends z.ZodTypeAny>(
  methodName: string,
  inputSchema: TInput,
  outputSchema: TOutput,
  options?: {
    description?: string;
    idempotent?: boolean;
  }
): RouteBuilder<TInput, TOutput>
```

#### 10. Version & Info

```typescript
/**
 * API version/info endpoint
 * GET /version or GET /info
 */
static version(options?: { path?: string }): RouteBuilder<
  z.ZodVoid,
  z.ZodObject<{
    version: z.ZodString;
    build?: z.ZodString;
    environment?: z.ZodString;
    timestamp?: z.ZodDate;
  }>
>
```

---

## Implementation Priority

### Phase 1 (High Priority - Common Patterns)
1. `batchRead()` - Very common need
2. `batchUpdate()` - Completes batch CRUD
3. `exists()` - Simple but useful
4. `upsert()` - Very common pattern
5. `RouteBuilder.health()` - Essential for deployments
6. `RouteBuilder.checkExists()` - Generic version of entity check
7. `RouteBuilder.action()` - Flexible action pattern
8. `RouteBuilder.upload()` / `RouteBuilder.download()` - File operations

### Phase 2 (Medium Priority - Advanced Patterns)
1. `archive()` / `restore()` - Soft delete pattern
2. `clone()` - Useful for complex entities
3. `aggregate()` - Analytics/reporting
4. `distinct()` - Dropdown/autocomplete data
5. `RouteBuilder.triggerJob()` / `RouteBuilder.jobStatus()` - Async jobs
6. `RouteBuilder.webhook()` - Integration pattern
7. `RouteBuilder.paginatedList()` - Generic pagination

### Phase 3 (Lower Priority - Specialized)
1. `history()` / `snapshot()` - Audit trail
2. `import()` / `export()` - Bulk data
3. `addRelation()` / `removeRelation()` - Relationships
4. `streamChanges()` - CDC pattern
5. `RouteBuilder.metrics()` - Observability
6. `RouteBuilder.subscribe()` - Real-time
7. `RouteBuilder.analytics()` - Advanced queries
8. `validate()` - Pre-validation

---

## Usage Examples

### StandardOperations Example

```typescript
import { standard } from "@repo/orpc-utils";
import { userSchema } from "./schemas";

const userOps = standard.zod(userSchema, "user");

// All CRUD operations
export const userReadContract = userOps.read().build();
export const userCreateContract = userOps.create().input(createUserSchema).build();
export const userUpdateContract = userOps.update().input(updateUserSchema).build();
export const userDeleteContract = userOps.delete().build();

// Batch operations
export const userBatchReadContract = userOps.batchRead().build();
export const userBatchUpdateContract = userOps.batchUpdate().build();

// Advanced patterns
export const userUpsertContract = userOps.upsert({ uniqueField: 'email' }).build();
export const userArchiveContract = userOps.archive().build();
export const userCloneContract = userOps.clone({ excludeFields: ['id', 'email'] }).build();
export const userHistoryContract = userOps.history().build();

// Aggregation
export const userAggregateContract = userOps.aggregate({
  operations: ['count', 'avg'],
  fields: ['age'],
  groupBy: ['status']
}).build();
```

### RouteBuilder Static Methods Example

```typescript
import { RouteBuilder } from "@repo/orpc-utils";

// Health & Status
export const healthContract = RouteBuilder.health({ includeDetails: true }).build();
export const readyContract = RouteBuilder.ready().build();

// Configuration
export const configContract = RouteBuilder.config(appConfigSchema).build();
export const updateConfigContract = RouteBuilder.updateConfig(appConfigSchema, { partial: true }).build();

// File operations
export const uploadContract = RouteBuilder.upload({
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/*', 'application/pdf'],
  multiple: true,
}).build();
export const downloadContract = RouteBuilder.download().build();

// Actions & Jobs
export const sendEmailContract = RouteBuilder.action(
  'sendEmail',
  emailInputSchema,
  z.object({ sent: z.boolean(), messageId: z.string() })
).build();

export const generateReportContract = RouteBuilder.triggerJob(
  'generateReport',
  reportParamsSchema
).build();
export const reportStatusContract = RouteBuilder.jobStatus(reportResultSchema).build();
export const reportProgressContract = RouteBuilder.streamJobProgress(reportResultSchema).build();

// Webhooks
export const stripeWebhookContract = RouteBuilder.webhook(
  'stripe',
  stripeEventSchema,
  { verifySignature: true }
).build();

// Generic pagination (non-entity)
export const auditLogsContract = RouteBuilder.paginatedList(
  auditLogSchema,
  {
    name: 'auditLogs',
    path: '/audit-logs',
    pagination: { defaultLimit: 50 },
    sorting: { fields: ['timestamp', 'action'] },
  }
).build();

// Real-time subscriptions
export const notificationsContract = RouteBuilder.subscribe(
  notificationSchema,
  { path: '/notifications/stream' }
).build();

// Generic RPC
export const calculateContract = RouteBuilder.rpc(
  'calculate',
  calculationInputSchema,
  calculationResultSchema,
  { idempotent: true }
).build();
```

---

## Summary

This proposal adds **~25 new methods** to `StandardOperations` and **~20 static methods** to `RouteBuilder`, covering:

| Category | StandardOperations | RouteBuilder Static |
|----------|-------------------|---------------------|
| Batch Operations | 3 methods | - |
| Existence/Validation | 2 methods | 1 method |
| Upsert | 2 methods | - |
| Soft Delete | 3 methods | - |
| Clone | 1 method | - |
| History/Audit | 2 methods | - |
| Aggregation | 2 methods | 1 method |
| Relations | 3 methods | - |
| Import/Export | 2 methods | - |
| Streaming | 2 methods | 2 methods |
| Health/Status | - | 3 methods |
| Configuration | - | 2 methods |
| Actions/Jobs | - | 4 methods |
| File Operations | - | 3 methods |
| Webhooks | - | 2 methods |
| Real-time | - | 2 methods |
| Version/Info | - | 1 method |

This comprehensive set of building blocks should cover **95%+ of common API patterns** while maintaining type safety and the fluent builder API.
