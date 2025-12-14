import { oc, eventIterator } from "@orpc/contract";
import type { HTTPPath } from "@orpc/contract";
import type { AnySchema } from "@orpc/contract";
import { z } from "zod/v4";
import type {
  RouteMetadata,
  CustomModifier,
  HttpMethod,
  ContractProcedureState,
} from "./types";
import { createRouteMethodMeta } from "./mount-method";

/**
 * Schema wrapper function type - transforms a schema into another schema type
 * Used for wrapping input/output schemas (e.g., eventIterator for streaming)
 */
export type SchemaWrapper<TSchema, TWrapped extends AnySchema> = (
  schema: TSchema
) => TWrapped;

/**
 * Identity wrapper that returns the schema unchanged
 */
export type IdentityWrapper = undefined;

/**
 * Type guard and cast helper for ZodObject operations
 * This provides type-safe access to ZodObject methods like pick, omit, extend, partial
 */
function asZodObject(schema: z.ZodType): z.ZodObject<z.ZodRawShape> | null {
  if (schema instanceof z.ZodObject) {
    return schema;
  }
  return null;
}


/**
 * Compute the final schema type after applying a wrapper
 * If wrapper is undefined (identity), returns the original schema type
 */
export type ApplyWrapper<
  TSchema,
  TWrapper extends SchemaWrapper<TSchema, AnySchema> | IdentityWrapper
> = TWrapper extends SchemaWrapper<TSchema, infer TWrapped> ? TWrapped : TSchema;

/**
 * Type for the eventIterator wrapper function
 */
export type EventIteratorWrapper = typeof eventIterator;

/**
 * Route builder for creating and customizing ORPC contracts with a fluent API
 * 
 * Supports optional schema wrappers that transform input/output at build time.
 * This enables advanced patterns like wrapping output with eventIterator for streaming.
 * 
 * @example
 * ```typescript
 * // Basic usage (no wrappers)
 * const contract = new RouteBuilder()
 *   .route({ method: "GET", path: "/users/{id}", summary: "Get user" })
 *   .input(z.object({ id: z.string() }))
 *   .output(userSchema)
 *   .build();
 * 
 * // With output wrapper (e.g., for streaming)
 * import { eventIterator } from "@orpc/contract";
 * const streamingContract = new RouteBuilder()
 *   .route({ method: "GET", path: "/users/stream" })
 *   .output(userSchema)
 *   .wrapOutput(eventIterator) // Output will be EventIterator<UserSchema>
 *   .build();
 * ```
 */
export class RouteBuilder<
  TInput extends z.ZodType = z.ZodVoid,
  TOutput extends z.ZodType = z.ZodVoid,
  TInputWrapper extends SchemaWrapper<TInput, AnySchema> | IdentityWrapper = IdentityWrapper,
  TOutputWrapper extends SchemaWrapper<TOutput, AnySchema> | IdentityWrapper = IdentityWrapper,
  TMethod extends HttpMethod = "GET"
> {
  private routeMetadata: RouteMetadata;
  private inputSchema: TInput;
  private outputSchema: TOutput;
  private _inputWrapper: TInputWrapper;
  private _outputWrapper: TOutputWrapper;
  private _method: TMethod;

  constructor(
    route?: RouteMetadata,
    input?: TInput,
    output?: TOutput,
    inputWrapper?: TInputWrapper,
    outputWrapper?: TOutputWrapper,
    method?: TMethod
  ) {
    this.routeMetadata = route ?? {};
    this.inputSchema = (input ?? z.void()) as TInput;
    this.outputSchema = (output ?? z.void()) as TOutput;
    this._inputWrapper = inputWrapper as TInputWrapper;
    this._outputWrapper = outputWrapper as TOutputWrapper;
    // Store the method type separately for type-level access
    // Default to "GET" for when method isn't explicitly set
    this._method = (method ?? (route?.method as TMethod | undefined) ?? "GET" as TMethod);
  }

  /**
   * Set or update route metadata
   * Note: If the metadata includes a method, it will NOT update the type-level method.
   * Use the method() function to change the method type.
   */
  route(metadata: RouteMetadata): this {
    this.routeMetadata = { ...this.routeMetadata, ...metadata };
    return this;
  }

  /**
   * Update specific route properties
   */
  updateRoute(updates: Partial<RouteMetadata>): this {
    this.routeMetadata = { ...this.routeMetadata, ...updates };
    return this;
  }

  /**
   * Set HTTP method
   * This returns a new RouteBuilder with the method type tracked at the type level.
   */
  method<TNewMethod extends HttpMethod>(method: TNewMethod): RouteBuilder<TInput, TOutput, TInputWrapper, TOutputWrapper, TNewMethod> {
    return new RouteBuilder(
      { ...this.routeMetadata, method },
      this.inputSchema,
      this.outputSchema,
      this._inputWrapper,
      this._outputWrapper,
      method
    );
  }

  /**
   * Set route path
   */
  path(path: string): this {
    this.routeMetadata.path = path as HTTPPath;
    return this;
  }

  /**
   * Set route summary
   */
  summary(summary: string): this {
    this.routeMetadata.summary = summary;
    return this;
  }

  /**
   * Set route description
   */
  description(description: string): this {
    this.routeMetadata.description = description;
    return this;
  }

  /**
   * Add tags to the route
   */
  tags(...tags: string[]): this {
    this.routeMetadata.tags = [
      ...(this.routeMetadata.tags ?? []),
      ...tags,
    ];
    return this;
  }

  /**
   * Mark route as deprecated
   */
  deprecated(deprecated = true): this {
    this.routeMetadata.deprecated = deprecated;
    return this;
  }

  /**
   * Set input schema
   * Note: Setting a new input schema resets the input wrapper since types may be incompatible
   */
  input<TNewInput extends z.ZodType>(
    schema: TNewInput
  ): RouteBuilder<TNewInput, TOutput, IdentityWrapper, TOutputWrapper, TMethod> {
    return new RouteBuilder(
      this.routeMetadata,
      schema,
      this.outputSchema,
      undefined, // Reset input wrapper - new schema may be incompatible
      this._outputWrapper,
      this._method
    );
  }

  /**
   * Set output schema
   * Note: Setting a new output schema resets the output wrapper since types may be incompatible
   */
  output<TNewOutput extends z.ZodType>(
    schema: TNewOutput
  ): RouteBuilder<TInput, TNewOutput, TInputWrapper, IdentityWrapper, TMethod> {
    return new RouteBuilder(
      this.routeMetadata,
      this.inputSchema,
      schema,
      this._inputWrapper,
      undefined, // Reset output wrapper - new schema may be incompatible
      this._method
    );
  }

  /**
   * Set a wrapper function for the input schema
   * The wrapper will be applied at build time to transform the input schema
   * 
   * @example
   * ```typescript
   * builder.wrapInput((schema) => z.array(schema)) // Input becomes array of original type
   * ```
   */
  wrapInput<TNewInputWrapper extends SchemaWrapper<TInput, AnySchema>>(
    wrapper: TNewInputWrapper
  ): RouteBuilder<TInput, TOutput, TNewInputWrapper, TOutputWrapper, TMethod> {
    return new RouteBuilder(
      this.routeMetadata,
      this.inputSchema,
      this.outputSchema,
      wrapper,
      this._outputWrapper,
      this._method
    );
  }

  /**
   * Set a wrapper function for the output schema
   * The wrapper will be applied at build time to transform the output schema
   * 
   * @example
   * ```typescript
   * import { eventIterator } from "@orpc/contract";
   * 
   * // Wrap output with eventIterator for streaming
   * builder.wrapOutput(eventIterator) // Output becomes EventIterator<OriginalType>
   * 
   * // Or custom wrapper
   * builder.wrapOutput((schema) => z.array(schema)) // Output becomes array
   * ```
   */
  wrapOutput<TNewOutputWrapper extends SchemaWrapper<TOutput, AnySchema>>(
    wrapper: TNewOutputWrapper
  ): RouteBuilder<TInput, TOutput, TInputWrapper, TNewOutputWrapper, TMethod> {
    return new RouteBuilder(
      this.routeMetadata,
      this.inputSchema,
      this.outputSchema,
      this._inputWrapper,
      wrapper,
      this._method
    );
  }

  /**
   * Clear the input wrapper (reset to identity/no-op)
   */
  unwrapInput(): RouteBuilder<TInput, TOutput, IdentityWrapper, TOutputWrapper, TMethod> {
    return new RouteBuilder(
      this.routeMetadata,
      this.inputSchema,
      this.outputSchema,
      undefined,
      this._outputWrapper,
      this._method
    );
  }

  /**
   * Clear the output wrapper (reset to identity/no-op)
   */
  unwrapOutput(): RouteBuilder<TInput, TOutput, TInputWrapper, IdentityWrapper, TMethod> {
    return new RouteBuilder(
      this.routeMetadata,
      this.inputSchema,
      this.outputSchema,
      this._inputWrapper,
      undefined,
      this._method
    );
  }

  /**
   * Access input schema builder for chaining modifications
   * Supports two patterns:
   * 1. Fluent: `.inputBuilder.omit(['field']).build()`
   * 2. Callback: `.inputBuilder((b) => b.omit(['field'])).build()`
   * 
   * Note: Input modifications will reset the input wrapper
   */
  get inputBuilder(): CallableInputSchemaProxy<TInput, TOutput, TInputWrapper, TOutputWrapper, TMethod> {
    return createCallableInputProxy(this);
  }

  /**
   * Access output schema builder for chaining modifications
   * Supports two patterns:
   * 1. Fluent: `.outputBuilder.omit(['field']).build()`
   * 2. Callback: `.outputBuilder((b) => b.omit(['field'])).build()`
   * 
   * Note: Output modifications will reset the output wrapper
   */
  get outputBuilder(): CallableOutputSchemaProxy<TInput, TOutput, TInputWrapper, TOutputWrapper, TMethod> {
    return createCallableOutputProxy(this);
  }

  /**
   * Apply custom modifications to the entire route builder
   */
  custom(
    modifier: CustomModifier<
      RouteBuilder<TInput, TOutput, TInputWrapper, TOutputWrapper, TMethod>,
      RouteBuilder<
        z.ZodType,
        z.ZodType,
        SchemaWrapper<z.ZodType, AnySchema> | IdentityWrapper,
        SchemaWrapper<z.ZodType, AnySchema> | IdentityWrapper,
        HttpMethod
      >
    >
  ): RouteBuilder<
    z.ZodType,
    z.ZodType,
    SchemaWrapper<z.ZodType, AnySchema> | IdentityWrapper,
    SchemaWrapper<z.ZodType, AnySchema> | IdentityWrapper,
    HttpMethod
  > {
    return modifier(this);
  }

  /**
   * Get current state (base schemas without wrappers applied)
   */
  getState(): ContractProcedureState<TInput, TOutput> {
    return {
      route: this.routeMetadata,
      input: this.inputSchema,
      output: this.outputSchema,
    };
  }

  /**
   * Build and return the ORPC contract
   * 
   * Applies any configured wrappers to input/output schemas before building.
   * The returned contract will have the wrapped types.
   * 
   * @example
   * ```typescript
   * // Without wrappers - output is UserSchema
   * builder.output(userSchema).build();
   * 
   * // With eventIterator wrapper - output is EventIterator<UserSchema>
   * builder.output(userSchema).wrapOutput(eventIterator).build();
   * ```
   */
  build() {
    // Apply wrappers if defined.
    //
    // IMPORTANT: keep the wrapped schema types intact so the resulting ORPC
    // contract stays fully typed (avoid collapsing to `AnySchema`).
    const finalInput = (
      this._inputWrapper ? this._inputWrapper(this.inputSchema) : this.inputSchema
    ) as ApplyWrapper<TInput, TInputWrapper>;

    const finalOutput = (
      this._outputWrapper ? this._outputWrapper(this.outputSchema) : this.outputSchema
    ) as ApplyWrapper<TOutput, TOutputWrapper>;

    // Inject route method metadata into the contract.
    // This enables the hook generator to:
    // 1. Identify this contract as RouteBuilder-created (not hand-made)
    // 2. Determine if it should generate query or mutation hooks
    //
    // IMPORTANT: Use this._method (TMethod generic) instead of this.routeMetadata.method
    // to preserve the specific method literal type (e.g., "GET", "POST") rather than
    // the union type HTTPMethod. This is essential for type-level discrimination.
    return oc
      .$meta(createRouteMethodMeta(this._method))
      .route(this.routeMetadata)
      .input(finalInput)
      .output(finalOutput);
  }

  /**
   * Get route metadata
   */
  getRouteMetadata(): RouteMetadata {
    return this.routeMetadata;
  }

  /**
   * Get input schema (base schema without wrapper applied)
   */
  getInputSchema(): TInput {
    return this.inputSchema;
  }

  /**
   * Get output schema (base schema without wrapper applied)
   */
  getOutputSchema(): TOutput {
    return this.outputSchema;
  }

  /**
   * Get the input wrapper function (undefined if no wrapper set)
   */
  getInputWrapper(): TInputWrapper {
    return this._inputWrapper;
  }

  /**
   * Get the output wrapper function (undefined if no wrapper set)
   */
  getOutputWrapper(): TOutputWrapper {
    return this._outputWrapper;
  }

  /**
   * Check if this builder has an output wrapper configured
   */
  hasOutputWrapper(): boolean {
    return this._outputWrapper !== undefined;
  }

  /**
   * Check if this builder has an input wrapper configured
   */
  hasInputWrapper(): boolean {
    return this._inputWrapper !== undefined;
  }

  // ============================================================================
  // STATIC FACTORY METHODS
  // Pre-configured builders for common patterns (health checks, actions, etc.)
  // ============================================================================

  /**
   * Create a health check endpoint
   * Returns status, timestamp, and optional details
   * 
   * @example
   * ```typescript
   * const healthContract = RouteBuilder.health().build();
   * // GET /health -> { status: 'healthy', timestamp: '...', details?: {...} }
   * ```
   */
  static health(options?: {
    path?: HTTPPath;
    includeDetails?: boolean;
  }) {
    const outputSchema = z.object({
      status: z.enum(['healthy', 'unhealthy', 'degraded']),
      timestamp: z.iso.datetime(),
      details: z.record(z.string(), z.unknown()).optional(),
    });

    return new RouteBuilder({
      method: 'GET',
      path: options?.path ?? '/health',
    })
      .input(z.object({}))
      .output(outputSchema);
  }

  /**
   * Create a readiness probe endpoint
   * Used by orchestrators (k8s) to check if service is ready to accept traffic
   * 
   * @example
   * ```typescript
   * const readyContract = RouteBuilder.ready().build();
   * // GET /ready -> { ready: true, checks: {...} }
   * ```
   */
  static ready(options?: {
    path?: HTTPPath;
  }) {
    const outputSchema = z.object({
      ready: z.boolean(),
      checks: z.record(z.string(), z.boolean()).optional(),
    });

    return new RouteBuilder({
      method: 'GET',
      path: options?.path ?? '/ready',
    })
      .input(z.object({}))
      .output(outputSchema);
  }

  /**
   * Create a liveness probe endpoint
   * Used by orchestrators (k8s) to check if service is alive
   * 
   * @example
   * ```typescript
   * const liveContract = RouteBuilder.live().build();
   * // GET /live -> { alive: true }
   * ```
   */
  static live(options?: {
    path?: HTTPPath;
  }) {
    const outputSchema = z.object({
      alive: z.boolean(),
    });

    return new RouteBuilder({
      method: 'GET',
      path: options?.path ?? '/live',
    })
      .input(z.object({}))
      .output(outputSchema);
  }

  /**
   * Create a generic existence check endpoint
   * 
   * @example
   * ```typescript
   * const checkEmailExists = RouteBuilder.checkExists(
   *   z.object({ email: z.string().email() }),
   *   { path: '/users/check-email' }
   * ).build();
   * ```
   */
  static checkExists<TInput extends z.ZodType>(
    inputSchema: TInput,
    options?: {
      path?: HTTPPath;
      method?: 'GET' | 'POST';
    }
  ) {
    const outputSchema = z.object({
      exists: z.boolean(),
    });

    return new RouteBuilder({
      method: options?.method ?? 'POST',
      path: options?.path ?? '/check-exists',
    })
      .input(inputSchema)
      .output(outputSchema);
  }

  /**
   * Create a generic action endpoint
   * For triggering operations that don't fit CRUD patterns
   * 
   * @example
   * ```typescript
   * const sendEmailContract = RouteBuilder.action(
   *   z.object({ to: z.string().email(), subject: z.string() }),
   *   z.object({ messageId: z.string() }),
   *   { path: '/emails/send', actionName: 'send-email' }
   * ).build();
   * ```
   */
  static action<TInput extends z.ZodType, TOutput extends z.ZodType>(
    inputSchema: TInput,
    outputSchema: TOutput,
    options?: {
      path?: HTTPPath;
      actionName?: string;
    }
  ): RouteBuilder<TInput, TOutput> {
    const path = options?.path ?? (options?.actionName ? `/${options.actionName}` : '/action');

    return new RouteBuilder({
      method: 'POST',
      path: path,
    })
      .input(inputSchema)
      .output(outputSchema);
  }

  /**
   * Create an async job trigger endpoint
   * Returns a job ID for tracking
   * 
   * @example
   * ```typescript
   * const triggerReportJob = RouteBuilder.triggerJob(
   *   z.object({ reportType: z.string() }),
   *   { path: '/reports/generate' }
   * ).build();
   * // POST /reports/generate -> { jobId: 'uuid', status: 'pending', ... }
   * ```
   */
  static triggerJob<TInput extends z.ZodType>(
    inputSchema: TInput,
    options?: {
      path?: HTTPPath;
    }
  ) {
    const outputSchema = z.object({
      jobId: z.uuid(),
      status: z.enum(['pending', 'queued', 'running']),
      estimatedTime: z.number().optional(),
    });

    return new RouteBuilder({
      method: 'POST',
      path: options?.path ?? '/jobs/trigger',
    })
      .input(inputSchema)
      .output(outputSchema);
  }

  /**
   * Create a job status check endpoint
   * 
   * @example
   * ```typescript
   * const checkJobStatus = RouteBuilder.jobStatus(
   *   reportResultSchema,
   *   { path: '/reports/status/{jobId}' }
   * ).build();
   * ```
   */
  static jobStatus<TResult extends z.ZodType>(
    resultSchema: TResult,
    options?: {
      path?: HTTPPath;
    }
  ) {
    const outputSchema = z.object({
      jobId: z.uuid(),
      status: z.enum(['pending', 'queued', 'running', 'completed', 'failed']),
      progress: z.number().min(0).max(100).optional(),
      result: resultSchema.optional(),
      error: z.string().optional(),
    });

    return new RouteBuilder({
      method: 'GET',
      path: options?.path ?? '/jobs/{jobId}/status',
    })
      .input(z.object({ jobId: z.uuid() }))
      .output(outputSchema);
  }

  /**
   * Create a streaming job progress endpoint
   * Uses eventIterator for real-time progress updates
   * 
   * @example
   * ```typescript
   * const streamJobProgress = RouteBuilder.streamJobProgress(
   *   reportResultSchema,
   *   { path: '/reports/progress/{jobId}' }
   * ).build();
   * ```
   */
  static streamJobProgress<TResult extends z.ZodType>(
    resultSchema: TResult,
    options?: {
      path?: HTTPPath;
    }
  ) {
    const progressSchema = z.object({
      progress: z.number().min(0).max(100),
      message: z.string().optional(),
      result: resultSchema.optional(),
    });

    return new RouteBuilder({
      method: 'GET',
      path: options?.path ?? '/jobs/{jobId}/progress',
    })
      .input(z.object({ jobId: z.uuid() }))
      .output(progressSchema)
      .wrapOutput(eventIterator);
  }

  /**
   * Create a file upload endpoint
   * 
   * @example
   * ```typescript
   * const uploadContract = RouteBuilder.upload({
   *   path: '/files/upload',
   *   maxSize: 10 * 1024 * 1024, // 10MB
   *   allowedTypes: ['image/png', 'image/jpeg'],
   * }).build();
   * ```
   */
  static upload(options?: {
    path?: HTTPPath;
    maxSize?: number;
    allowedTypes?: string[];
  }) {
    // Note: File validation is typically done at runtime by the handler
    // Using z.custom for File type since z.instanceof(File) has typing issues in different environments
    const inputSchema = z.object({
      file: z.custom<File>((val) => typeof File !== 'undefined' && val instanceof File),
      metadata: z.record(z.string(), z.string()).optional(),
    });

    const outputSchema = z.object({
      fileId: z.string(),
      filename: z.string(),
      size: z.number(),
      mimeType: z.string(),
      url: z.url().optional(),
    });

    return new RouteBuilder({
      method: 'POST',
      path: options?.path ?? '/upload',
    })
      .input(inputSchema)
      .output(outputSchema);
  }

  /**
   * Create a file download endpoint
   * 
   * @example
   * ```typescript
   * const downloadContract = RouteBuilder.download({
   *   path: '/files/{fileId}/download',
   * }).build();
   * ```
   */
  static download(options?: {
    path?: HTTPPath;
  }) {
    const inputSchema = z.object({
      fileId: z.string(),
    });

    // Note: Blob handling is typically done at runtime
    // Using z.custom for Blob type since z.instanceof(Blob) has typing issues in different environments
    const outputSchema = z.object({
      data: z.custom<Blob>((val) => typeof Blob !== 'undefined' && val instanceof Blob),
      filename: z.string(),
      mimeType: z.string(),
      size: z.number(),
    });

    return new RouteBuilder({
      method: 'GET',
      path: options?.path ?? '/download/{fileId}',
    })
      .input(inputSchema)
      .output(outputSchema);
  }

  /**
   * Create a webhook receiver endpoint
   * 
   * @example
   * ```typescript
   * const stripeWebhook = RouteBuilder.webhook(
   *   stripeEventSchema,
   *   { path: '/webhooks/stripe' }
   * ).build();
   * ```
   */
  static webhook<TPayload extends z.ZodType>(
    payloadSchema: TPayload,
    options?: {
      path?: HTTPPath;
    }
  ) {
    const outputSchema = z.object({
      received: z.boolean(),
      processedAt: z.iso.datetime(),
    });

    return new RouteBuilder({
      method: 'POST',
      path: options?.path ?? '/webhook',
    })
      .input(payloadSchema)
      .output(outputSchema);
  }

  /**
   * Create a metrics endpoint (Prometheus-compatible)
   * 
   * @example
   * ```typescript
   * const metricsContract = RouteBuilder.metrics().build();
   * // GET /metrics -> { metrics: [...], timestamp: '...' }
   * ```
   */
  static metrics(options?: {
    path?: HTTPPath;
  }) {
    const outputSchema = z.object({
      metrics: z.array(z.object({
        name: z.string(),
        value: z.number(),
        labels: z.record(z.string(), z.string()).optional(),
      })),
      timestamp: z.iso.datetime(),
    });

    return new RouteBuilder({
      method: 'GET',
      path: options?.path ?? '/metrics',
    })
      .input(z.object({}))
      .output(outputSchema);
  }

  /**
   * Create a configuration endpoint
   * Returns application configuration (public, non-sensitive)
   * 
   * @example
   * ```typescript
   * const configContract = RouteBuilder.config(
   *   appConfigSchema,
   *   { path: '/api/config' }
   * ).build();
   * ```
   */
  static config<TConfig extends z.ZodType>(
    configSchema: TConfig,
    options?: {
      path?: HTTPPath;
    }
  ) {
    return new RouteBuilder({
      method: 'GET',
      path: options?.path ?? '/config',
    })
      .input(z.object({}))
      .output(configSchema);
  }

  /**
   * Create a version endpoint
   * 
   * @example
   * ```typescript
   * const versionContract = RouteBuilder.version().build();
   * // GET /version -> { version: '1.0.0', commit: 'abc123', ... }
   * ```
   */
  static version(options?: {
    path?: HTTPPath;
  }) {
    const outputSchema = z.object({
      version: z.string(),
      commit: z.string().optional(),
      buildDate: z.iso.datetime().optional(),
      environment: z.string().optional(),
    });

    return new RouteBuilder({
      method: 'GET',
      path: options?.path ?? '/version',
    })
      .input(z.object({}))
      .output(outputSchema);
  }
}

/**
 * Proxy class for input schema modifications
 * Supports chainable operations that can be used in callback pattern:
 * `.inputBuilder((b) => b.omit(['x']).extend({y: z.string()}))`
 * 
 * Note: All modifications reset the input wrapper since the schema type changes
 */
class InputSchemaProxy<
  TInput extends z.ZodType,
  TOutput extends z.ZodType,
  TInputWrapper extends SchemaWrapper<TInput, AnySchema> | IdentityWrapper,
  TOutputWrapper extends SchemaWrapper<TOutput, AnySchema> | IdentityWrapper,
  TMethod extends HttpMethod = "GET"
> {
  constructor(private _routeBuilder: RouteBuilder<TInput, TOutput, TInputWrapper, TOutputWrapper, TMethod>) {}

  /** Get the underlying RouteBuilder */
  getRouteBuilder(): RouteBuilder<TInput, TOutput, TInputWrapper, TOutputWrapper, TMethod> {
    return this._routeBuilder;
  }

  /** Build the route (delegates to RouteBuilder.build()) */
  build() {
    return this._routeBuilder.build();
  }

  /**
   * Access the custom method for input schema modifications
   */
  custom<TNewInput extends z.ZodType>(
    modifier: CustomModifier<TInput, TNewInput>
  ): InputSchemaProxy<TNewInput, TOutput, IdentityWrapper, TOutputWrapper, TMethod> {
    const newInput = modifier(this._routeBuilder.getInputSchema());
    const newBuilder = this._routeBuilder.input(newInput);
    return new InputSchemaProxy(newBuilder);
  }

  /**
   * Pick fields from input schema (if it's an object)
   */
  pick<K extends keyof z.infer<TInput>>(
    keys: readonly K[]
  ): InputSchemaProxy<
    TInput extends z.ZodObject<infer Shape>
      ? z.ZodObject<Pick<Shape, K & keyof Shape>>
      : z.ZodType,
    TOutput,
    IdentityWrapper,
    TOutputWrapper,
    TMethod
  > {
    const input = this._routeBuilder.getInputSchema();
    const zodObj = asZodObject(input);
    if (zodObj) {
      const picked = zodObj.pick(
        Object.fromEntries(keys.map((k) => [k, true])) as Record<string, true>
      );
      const newBuilder = this._routeBuilder.input(picked);
      // Type assertion needed due to complex conditional type inference
      return new InputSchemaProxy(newBuilder) as unknown as InputSchemaProxy<
        TInput extends z.ZodObject<infer Shape>
          ? z.ZodObject<Pick<Shape, K & keyof Shape>>
          : z.ZodType,
        TOutput,
        IdentityWrapper,
        TOutputWrapper,
        TMethod
      >;
    }
    throw new Error("Input schema does not support pick operation");
  }

  /**
   * Omit fields from input schema (if it's an object)
   */
  omit<K extends keyof z.infer<TInput>>(
    keys: readonly K[]
  ): InputSchemaProxy<
    TInput extends z.ZodObject<infer Shape>
      ? z.ZodObject<Omit<Shape, K & keyof Shape>>
      : z.ZodType,
    TOutput,
    IdentityWrapper,
    TOutputWrapper,
    TMethod
  > {
    const input = this._routeBuilder.getInputSchema();
    const zodObj = asZodObject(input);
    if (zodObj) {
      const omitted = zodObj.omit(
        Object.fromEntries(keys.map((k) => [k, true])) as Record<string, true>
      );
      const newBuilder = this._routeBuilder.input(omitted);
      return new InputSchemaProxy(newBuilder) as unknown as InputSchemaProxy<
        TInput extends z.ZodObject<infer Shape>
          ? z.ZodObject<Omit<Shape, K & keyof Shape>>
          : z.ZodType,
        TOutput,
        IdentityWrapper,
        TOutputWrapper,
        TMethod
      >;
    }
    throw new Error("Input schema does not support omit operation");
  }

  /**
   * Extend input schema (if it's an object)
   */
  extend<TExtension extends z.ZodRawShape>(
    extension: TExtension
  ): InputSchemaProxy<
    TInput extends z.ZodObject<infer Shape>
      ? z.ZodObject<Shape & TExtension>
      : z.ZodType,
    TOutput,
    IdentityWrapper,
    TOutputWrapper,
    TMethod
  > {
    const input = this._routeBuilder.getInputSchema();
    const zodObj = asZodObject(input);
    if (zodObj) {
      const extended = zodObj.extend(extension);
      const newBuilder = this._routeBuilder.input(extended);
      return new InputSchemaProxy(newBuilder) as unknown as InputSchemaProxy<
        TInput extends z.ZodObject<infer Shape>
          ? z.ZodObject<Shape & TExtension>
          : z.ZodType,
        TOutput,
        IdentityWrapper,
        TOutputWrapper,
        TMethod
      >;
    }
    throw new Error("Input schema does not support extend operation");
  }

  /**
   * Make input schema partial (all fields or specific fields)
   */
  partial<K extends keyof z.infer<TInput> = keyof z.infer<TInput>>(
    keys?: readonly K[]
  ): InputSchemaProxy<
    TInput extends z.ZodObject<infer Shape>
      ? z.ZodObject<{
          [P in keyof Shape]: P extends Extract<K, keyof Shape> ? z.ZodOptional<Shape[P]> : Shape[P];
        }>
      : z.ZodType,
    TOutput,
    IdentityWrapper,
    TOutputWrapper,
    TMethod
  > {
    const input = this._routeBuilder.getInputSchema();
    const zodObj = asZodObject(input);
    if (zodObj) {
      const partialSchema = keys
        ? zodObj.partial(
            Object.fromEntries(keys.map((k) => [k, true])) as Record<string, true>
          )
        : zodObj.partial();

      const newBuilder = this._routeBuilder.input(partialSchema);
      return new InputSchemaProxy(newBuilder) as unknown as InputSchemaProxy<
        TInput extends z.ZodObject<infer Shape>
          ? z.ZodObject<{
              [P in keyof Shape]: P extends Extract<K, keyof Shape>
                ? z.ZodOptional<Shape[P]>
                : Shape[P];
            }>
          : z.ZodType,
        TOutput,
        IdentityWrapper,
        TOutputWrapper,
        TMethod
      >;
    }
    throw new Error("Input schema does not support partial operation");
  }

  /**
   * Add default values to input schema fields
   */
  addDefaults(
    defaults: Partial<z.infer<TInput>>
  ): InputSchemaProxy<TInput, TOutput, IdentityWrapper, TOutputWrapper, TMethod> {
    const input = this._routeBuilder.getInputSchema();
    const zodObj = asZodObject(input);
    if (zodObj) {
      const shape = zodObj.shape;
      const newShape: Record<string, z.ZodType> = {};
      
      for (const [key, schema] of Object.entries(shape)) {
        if (key in defaults) {
          newShape[key] = (schema as z.ZodType).default(defaults[key as keyof typeof defaults]);
        } else {
          newShape[key] = schema as z.ZodType;
        }
      }
      
      const newInput = z.object(newShape);
      const newBuilder = this._routeBuilder.input(newInput);
      return new InputSchemaProxy(newBuilder) as unknown as InputSchemaProxy<TInput, TOutput, IdentityWrapper, TOutputWrapper, TMethod>;
    }
    throw new Error("Input schema must be a ZodObject to add defaults");
  }
}

/**
 * Proxy class for output schema modifications
 * Supports chainable operations that can be used in callback pattern:
 * `.outputBuilder((b) => b.omit(['x']).extend({y: z.string()}))`
 * 
 * Note: All modifications reset the output wrapper since the schema type changes
 */
class OutputSchemaProxy<
  TInput extends z.ZodType,
  TOutput extends z.ZodType,
  TInputWrapper extends SchemaWrapper<TInput, AnySchema> | IdentityWrapper,
  TOutputWrapper extends SchemaWrapper<TOutput, AnySchema> | IdentityWrapper,
  TMethod extends HttpMethod = "GET"
> {
  constructor(private _routeBuilder: RouteBuilder<TInput, TOutput, TInputWrapper, TOutputWrapper, TMethod>) {}

  /** Get the underlying RouteBuilder */
  getRouteBuilder(): RouteBuilder<TInput, TOutput, TInputWrapper, TOutputWrapper, TMethod> {
    return this._routeBuilder;
  }

  /** Build the route (delegates to RouteBuilder.build()) */
  build() {
    return this._routeBuilder.build();
  }

  /**
   * Access the custom method for output schema modifications
   */
  custom<TNewOutput extends z.ZodType>(
    modifier: CustomModifier<TOutput, TNewOutput>
  ): OutputSchemaProxy<TInput, TNewOutput, TInputWrapper, IdentityWrapper, TMethod> {
    const newOutput = modifier(this._routeBuilder.getOutputSchema());
    const newBuilder = this._routeBuilder.output(newOutput);
    return new OutputSchemaProxy(newBuilder);
  }

  /**
   * Pick fields from output schema (if it's an object)
   */
  pick<K extends keyof z.infer<TOutput>>(
    keys: readonly K[]
  ): OutputSchemaProxy<
    TInput,
    TOutput extends z.ZodObject<infer Shape>
      ? z.ZodObject<Pick<Shape, K & keyof Shape>>
      : z.ZodType,
    TInputWrapper,
    IdentityWrapper,
    TMethod
  > {
    const output = this._routeBuilder.getOutputSchema();
    const zodObj = asZodObject(output);
    if (zodObj) {
      const picked = zodObj.pick(
        Object.fromEntries(keys.map((k) => [k, true])) as Record<string, true>
      );
      const newBuilder = this._routeBuilder.output(picked);
      return new OutputSchemaProxy(newBuilder) as unknown as OutputSchemaProxy<
        TInput,
        TOutput extends z.ZodObject<infer Shape>
          ? z.ZodObject<Pick<Shape, K & keyof Shape>>
          : z.ZodType,
        TInputWrapper,
        IdentityWrapper,
        TMethod
      >;
    }
    throw new Error("Output schema does not support pick operation");
  }

  /**
   * Omit fields from output schema (if it's an object)
   */
  omit<K extends keyof z.infer<TOutput>>(
    keys: readonly K[]
  ): OutputSchemaProxy<
    TInput,
    TOutput extends z.ZodObject<infer Shape>
      ? z.ZodObject<Omit<Shape, K & keyof Shape>>
      : z.ZodType,
    TInputWrapper,
    IdentityWrapper,
    TMethod
  > {
    const output = this._routeBuilder.getOutputSchema();
    const zodObj = asZodObject(output);
    if (zodObj) {
      const omitted = zodObj.omit(
        Object.fromEntries(keys.map((k) => [k, true])) as Record<string, true>
      );
      const newBuilder = this._routeBuilder.output(omitted);
      return new OutputSchemaProxy(newBuilder) as unknown as OutputSchemaProxy<
        TInput,
        TOutput extends z.ZodObject<infer Shape>
          ? z.ZodObject<Omit<Shape, K & keyof Shape>>
          : z.ZodType,
        TInputWrapper,
        IdentityWrapper,
        TMethod
      >;
    }
    throw new Error("Output schema does not support omit operation");
  }

  /**
   * Extend output schema (if it's an object)
   */
  extend<TExtension extends z.ZodRawShape>(
    extension: TExtension
  ): OutputSchemaProxy<
    TInput,
    TOutput extends z.ZodObject<infer Shape>
      ? z.ZodObject<Shape & TExtension>
      : z.ZodType,
    TInputWrapper,
    IdentityWrapper,
    TMethod
  > {
    const output = this._routeBuilder.getOutputSchema();
    const zodObj = asZodObject(output);
    if (zodObj) {
      const extended = zodObj.extend(extension);
      const newBuilder = this._routeBuilder.output(extended);
      return new OutputSchemaProxy(newBuilder) as unknown as OutputSchemaProxy<
        TInput,
        TOutput extends z.ZodObject<infer Shape>
          ? z.ZodObject<Shape & TExtension>
          : z.ZodType,
        TInputWrapper,
        IdentityWrapper,
        TMethod
      >;
    }
    throw new Error("Output schema does not support extend operation");
  }

  /**
   * Make output nullable
   */
  nullable(): OutputSchemaProxy<TInput, z.ZodNullable<TOutput>, TInputWrapper, IdentityWrapper, TMethod> {
    const nullable = this._routeBuilder.getOutputSchema().nullable();
    const newBuilder = this._routeBuilder.output(nullable);
    return new OutputSchemaProxy(newBuilder);
  }

  /**
   * Make output schema partial (all fields or specific fields)
   */
  partial<K extends keyof z.infer<TOutput> = keyof z.infer<TOutput>>(
    keys?: readonly K[]
  ): OutputSchemaProxy<
    TInput,
    TOutput extends z.ZodObject<infer Shape>
      ? z.ZodObject<{
          [P in keyof Shape]: P extends Extract<K, keyof Shape> ? z.ZodOptional<Shape[P]> : Shape[P];
        }>
      : z.ZodType,
    TInputWrapper,
    IdentityWrapper,
    TMethod
  > {
    const output = this._routeBuilder.getOutputSchema();
    const zodObj = asZodObject(output);
    if (zodObj) {
      const partialSchema = keys
        ? zodObj.partial(
            Object.fromEntries(keys.map((k) => [k, true])) as Record<string, true>
          )
        : zodObj.partial();

      const newBuilder = this._routeBuilder.output(partialSchema);
      return new OutputSchemaProxy(newBuilder) as unknown as OutputSchemaProxy<
        TInput,
        TOutput extends z.ZodObject<infer Shape>
          ? z.ZodObject<{
              [P in keyof Shape]: P extends Extract<K, keyof Shape>
                ? z.ZodOptional<Shape[P]>
                : Shape[P];
            }>
          : z.ZodType,
        TInputWrapper,
        IdentityWrapper,
        TMethod
      >;
    }
    throw new Error("Output schema does not support partial operation");
  }
}

/**
 * Type for callable input schema proxy
 * Supports both:
 * - Fluent access: `.inputBuilder.omit(['field'])`
 * - Callback pattern: `.inputBuilder((b) => b.omit(['field']))`
 */
type CallableInputSchemaProxy<
  TInput extends z.ZodType,
  TOutput extends z.ZodType,
  TInputWrapper extends SchemaWrapper<TInput, AnySchema> | IdentityWrapper,
  TOutputWrapper extends SchemaWrapper<TOutput, AnySchema> | IdentityWrapper,
  TMethod extends HttpMethod = "GET"
> = InputSchemaProxy<TInput, TOutput, TInputWrapper, TOutputWrapper, TMethod> & (<TNewInput extends z.ZodType>(
    callback: (proxy: InputSchemaProxy<TInput, TOutput, TInputWrapper, TOutputWrapper, TMethod>) => 
      InputSchemaProxy<TNewInput, TOutput, IdentityWrapper, TOutputWrapper, TMethod> | RouteBuilder<TNewInput, TOutput, IdentityWrapper, TOutputWrapper, TMethod>
  ) => RouteBuilder<TNewInput, TOutput, IdentityWrapper, TOutputWrapper, TMethod>);

/**
 * Type for callable output schema proxy
 * Supports both:
 * - Fluent access: `.outputBuilder.omit(['field'])`
 * - Callback pattern: `.outputBuilder((b) => b.omit(['field']))`
 */
type CallableOutputSchemaProxy<
  TInput extends z.ZodType,
  TOutput extends z.ZodType,
  TInputWrapper extends SchemaWrapper<TInput, AnySchema> | IdentityWrapper,
  TOutputWrapper extends SchemaWrapper<TOutput, AnySchema> | IdentityWrapper,
  TMethod extends HttpMethod = "GET"
> = OutputSchemaProxy<TInput, TOutput, TInputWrapper, TOutputWrapper, TMethod> & (<TNewOutput extends z.ZodType>(
    callback: (proxy: OutputSchemaProxy<TInput, TOutput, TInputWrapper, TOutputWrapper, TMethod>) => 
      OutputSchemaProxy<TInput, TNewOutput, TInputWrapper, IdentityWrapper, TMethod> | RouteBuilder<TInput, TNewOutput, TInputWrapper, IdentityWrapper, TMethod>
  ) => RouteBuilder<TInput, TNewOutput, TInputWrapper, IdentityWrapper, TMethod>);

/**
 * Creates a callable input schema proxy that supports both:
 * - Fluent API: `.inputBuilder.omit(['field'])`
 * - Callback API: `.inputBuilder((b) => b.omit(['field']))`
 */
function createCallableInputProxy<
  TInput extends z.ZodType,
  TOutput extends z.ZodType,
  TInputWrapper extends SchemaWrapper<TInput, AnySchema> | IdentityWrapper,
  TOutputWrapper extends SchemaWrapper<TOutput, AnySchema> | IdentityWrapper,
  TMethod extends HttpMethod = "GET"
>(
  routeBuilder: RouteBuilder<TInput, TOutput, TInputWrapper, TOutputWrapper, TMethod>
): CallableInputSchemaProxy<TInput, TOutput, TInputWrapper, TOutputWrapper, TMethod> {
  const proxy = new InputSchemaProxy(routeBuilder);
  
  // Create a callable function that also has the proxy methods
  const callable = function<TNewInput extends z.ZodType>(
    callback: (proxy: InputSchemaProxy<TInput, TOutput, TInputWrapper, TOutputWrapper, TMethod>) => 
      InputSchemaProxy<TNewInput, TOutput, IdentityWrapper, TOutputWrapper, TMethod> | RouteBuilder<TNewInput, TOutput, IdentityWrapper, TOutputWrapper, TMethod>
  ): RouteBuilder<TNewInput, TOutput, IdentityWrapper, TOutputWrapper, TMethod> {
    const result = callback(proxy);
    // Handle both proxy and RouteBuilder returns
    if (result instanceof InputSchemaProxy) {
      return result.getRouteBuilder();
    }
    return result;
  };
  
  // Attach all proxy methods to the callable
  Object.assign(callable, {
    custom: proxy.custom.bind(proxy),
    pick: proxy.pick.bind(proxy),
    omit: proxy.omit.bind(proxy),
    extend: proxy.extend.bind(proxy),
    partial: proxy.partial.bind(proxy),
    addDefaults: proxy.addDefaults.bind(proxy),
    getRouteBuilder: proxy.getRouteBuilder.bind(proxy),
    build: proxy.build.bind(proxy),
  });
  
  return callable as CallableInputSchemaProxy<TInput, TOutput, TInputWrapper, TOutputWrapper, TMethod>;
}

/**
 * Creates a callable output schema proxy that supports both:
 * - Fluent API: `.outputBuilder.omit(['field'])`
 * - Callback API: `.outputBuilder((b) => b.omit(['field']))`
 */
function createCallableOutputProxy<
  TInput extends z.ZodType,
  TOutput extends z.ZodType,
  TInputWrapper extends SchemaWrapper<TInput, AnySchema> | IdentityWrapper,
  TOutputWrapper extends SchemaWrapper<TOutput, AnySchema> | IdentityWrapper,
  TMethod extends HttpMethod = "GET"
>(
  routeBuilder: RouteBuilder<TInput, TOutput, TInputWrapper, TOutputWrapper, TMethod>
): CallableOutputSchemaProxy<TInput, TOutput, TInputWrapper, TOutputWrapper, TMethod> {
  const proxy = new OutputSchemaProxy(routeBuilder);
  
  // Create a callable function that also has the proxy methods
  const callable = function<TNewOutput extends z.ZodType>(
    callback: (proxy: OutputSchemaProxy<TInput, TOutput, TInputWrapper, TOutputWrapper, TMethod>) => 
      OutputSchemaProxy<TInput, TNewOutput, TInputWrapper, IdentityWrapper, TMethod> | RouteBuilder<TInput, TNewOutput, TInputWrapper, IdentityWrapper, TMethod>
  ): RouteBuilder<TInput, TNewOutput, TInputWrapper, IdentityWrapper, TMethod> {
    const result = callback(proxy);
    // Handle both proxy and RouteBuilder returns
    if (result instanceof OutputSchemaProxy) {
      return result.getRouteBuilder();
    }
    return result;
  };
  
  // Attach all proxy methods to the callable
  Object.assign(callable, {
    custom: proxy.custom.bind(proxy),
    pick: proxy.pick.bind(proxy),
    omit: proxy.omit.bind(proxy),
    extend: proxy.extend.bind(proxy),
    nullable: proxy.nullable.bind(proxy),
    partial: proxy.partial.bind(proxy),
    getRouteBuilder: proxy.getRouteBuilder.bind(proxy),
    build: proxy.build.bind(proxy),
  });
  
  return callable as CallableOutputSchemaProxy<TInput, TOutput, TInputWrapper, TOutputWrapper, TMethod>;
}

/**
 * Helper function to create a route builder
 */
export function route(metadata?: RouteMetadata): RouteBuilder {
  return new RouteBuilder(metadata);
}
