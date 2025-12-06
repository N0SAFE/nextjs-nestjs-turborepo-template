import { oc } from "@orpc/contract";
import { z } from "zod/v4";
import { SchemaBuilder } from "./schema-builder";
import type {
  RouteMetadata,
  CustomModifier,
  HttpMethod,
  ContractProcedureState,
} from "./types";

/**
 * Route builder for creating and customizing ORPC contracts with a fluent API
 * 
 * @example
 * ```typescript
 * const contract = new RouteBuilder()
 *   .route({ method: "GET", path: "/users/{id}", summary: "Get user" })
 *   .input(z.object({ id: z.string() }))
 *   .output(userSchema)
 *   .custom((builder) => builder.updateRoute({ deprecated: true }))
 *   .build();
 * ```
 */
export class RouteBuilder<
  TInput extends z.ZodTypeAny = z.ZodVoid,
  TOutput extends z.ZodTypeAny = z.ZodVoid
> {
  private routeMetadata: RouteMetadata;
  private inputSchema: TInput;
  private outputSchema: TOutput;

  constructor(
    route?: RouteMetadata,
    input?: TInput,
    output?: TOutput
  ) {
    this.routeMetadata = route ?? {
      method: "GET",
      path: "/",
    };
    this.inputSchema = (input ?? z.void()) as TInput;
    this.outputSchema = (output ?? z.void()) as TOutput;
  }

  /**
   * Set or update route metadata
   */
  route(metadata: RouteMetadata): RouteBuilder<TInput, TOutput> {
    this.routeMetadata = { ...this.routeMetadata, ...metadata };
    return this;
  }

  /**
   * Update specific route properties
   */
  updateRoute(updates: Partial<RouteMetadata>): RouteBuilder<TInput, TOutput> {
    this.routeMetadata = { ...this.routeMetadata, ...updates };
    return this;
  }

  /**
   * Set HTTP method
   */
  method(method: HttpMethod): RouteBuilder<TInput, TOutput> {
    this.routeMetadata.method = method;
    return this;
  }

  /**
   * Set route path
   */
  path(path: string): RouteBuilder<TInput, TOutput> {
    this.routeMetadata.path = path;
    return this;
  }

  /**
   * Set route summary
   */
  summary(summary: string): RouteBuilder<TInput, TOutput> {
    this.routeMetadata.summary = summary;
    return this;
  }

  /**
   * Set route description
   */
  description(description: string): RouteBuilder<TInput, TOutput> {
    this.routeMetadata.description = description;
    return this;
  }

  /**
   * Add tags to the route
   */
  tags(...tags: string[]): RouteBuilder<TInput, TOutput> {
    this.routeMetadata.tags = [
      ...(this.routeMetadata.tags ?? []),
      ...tags,
    ];
    return this;
  }

  /**
   * Mark route as deprecated
   */
  deprecated(deprecated: boolean = true): RouteBuilder<TInput, TOutput> {
    this.routeMetadata.deprecated = deprecated;
    return this;
  }

  /**
   * Set input schema
   */
  input<TNewInput extends z.ZodTypeAny>(
    schema: TNewInput
  ): RouteBuilder<TNewInput, TOutput> {
    return new RouteBuilder(this.routeMetadata, schema, this.outputSchema);
  }

  /**
   * Set output schema
   */
  output<TNewOutput extends z.ZodTypeAny>(
    schema: TNewOutput
  ): RouteBuilder<TInput, TNewOutput> {
    return new RouteBuilder(this.routeMetadata, this.inputSchema, schema);
  }

  /**
   * Access input schema builder for chaining modifications
   */
  get inputBuilder(): InputSchemaProxy<TInput, TOutput> {
    return new InputSchemaProxy(this);
  }

  /**
   * Access output schema builder for chaining modifications
   */
  get outputBuilder(): OutputSchemaProxy<TInput, TOutput> {
    return new OutputSchemaProxy(this);
  }

  /**
   * Apply custom modifications to the entire route builder
   */
  custom(
    modifier: CustomModifier<RouteBuilder<TInput, TOutput>, RouteBuilder<any, any>>
  ): RouteBuilder<any, any> {
    return modifier(this);
  }

  /**
   * Get current state
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
   */
  build() {
    const contract = oc
      .route(this.routeMetadata as any)
      .input(this.inputSchema)
      .output(this.outputSchema);

    return contract;
  }

  /**
   * Get route metadata
   */
  getRouteMetadata(): RouteMetadata {
    return this.routeMetadata;
  }

  /**
   * Get input schema
   */
  getInputSchema(): TInput {
    return this.inputSchema;
  }

  /**
   * Get output schema
   */
  getOutputSchema(): TOutput {
    return this.outputSchema;
  }
}

/**
 * Proxy class for input schema modifications
 */
class InputSchemaProxy<
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny
> {
  constructor(private routeBuilder: RouteBuilder<TInput, TOutput>) {}

  /**
   * Access the custom method for input schema modifications
   */
  custom<TNewInput extends z.ZodTypeAny>(
    modifier: CustomModifier<TInput, TNewInput>
  ): RouteBuilder<TNewInput, TOutput> {
    const newInput = modifier(this.routeBuilder.getInputSchema());
    return this.routeBuilder.input(newInput);
  }

  /**
   * Pick fields from input schema (if it's an object)
   */
  pick<K extends keyof z.infer<TInput>>(
    keys: readonly K[]
  ): RouteBuilder<any, TOutput> {
    const input = this.routeBuilder.getInputSchema();
    if ("pick" in input) {
      const picked = (input as any).pick(
        Object.fromEntries(keys.map((k) => [k, true]))
      );
      return this.routeBuilder.input(picked);
    }
    throw new Error("Input schema does not support pick operation");
  }

  /**
   * Omit fields from input schema (if it's an object)
   */
  omit<K extends keyof z.infer<TInput>>(
    keys: readonly K[]
  ): RouteBuilder<any, TOutput> {
    const input = this.routeBuilder.getInputSchema();
    if ("omit" in input) {
      const omitted = (input as any).omit(
        Object.fromEntries(keys.map((k) => [k, true]))
      );
      return this.routeBuilder.input(omitted);
    }
    throw new Error("Input schema does not support omit operation");
  }

  /**
   * Extend input schema (if it's an object)
   */
  extend<TExtension extends z.ZodRawShape>(
    extension: TExtension
  ): RouteBuilder<any, TOutput> {
    const input = this.routeBuilder.getInputSchema();
    if ("extend" in input) {
      const extended = (input as any).extend(extension);
      return this.routeBuilder.input(extended);
    }
    throw new Error("Input schema does not support extend operation");
  }

  /**
   * Make input schema partial
   */
  partial(): RouteBuilder<any, TOutput> {
    const input = this.routeBuilder.getInputSchema();
    if ("partial" in input) {
      const partial = (input as any).partial();
      return this.routeBuilder.input(partial);
    }
    throw new Error("Input schema does not support partial operation");
  }
}

/**
 * Proxy class for output schema modifications
 */
class OutputSchemaProxy<
  TInput extends z.ZodTypeAny,
  TOutput extends z.ZodTypeAny
> {
  constructor(private routeBuilder: RouteBuilder<TInput, TOutput>) {}

  /**
   * Access the custom method for output schema modifications
   */
  custom<TNewOutput extends z.ZodTypeAny>(
    modifier: CustomModifier<TOutput, TNewOutput>
  ): RouteBuilder<TInput, TNewOutput> {
    const newOutput = modifier(this.routeBuilder.getOutputSchema());
    return this.routeBuilder.output(newOutput);
  }

  /**
   * Pick fields from output schema (if it's an object)
   */
  pick<K extends keyof z.infer<TOutput>>(
    keys: readonly K[]
  ): RouteBuilder<TInput, any> {
    const output = this.routeBuilder.getOutputSchema();
    if ("pick" in output) {
      const picked = (output as any).pick(
        Object.fromEntries(keys.map((k) => [k, true]))
      );
      return this.routeBuilder.output(picked);
    }
    throw new Error("Output schema does not support pick operation");
  }

  /**
   * Omit fields from output schema (if it's an object)
   */
  omit<K extends keyof z.infer<TOutput>>(
    keys: readonly K[]
  ): RouteBuilder<TInput, any> {
    const output = this.routeBuilder.getOutputSchema();
    if ("omit" in output) {
      const omitted = (output as any).omit(
        Object.fromEntries(keys.map((k) => [k, true]))
      );
      return this.routeBuilder.output(omitted);
    }
    throw new Error("Output schema does not support omit operation");
  }

  /**
   * Extend output schema (if it's an object)
   */
  extend<TExtension extends z.ZodRawShape>(
    extension: TExtension
  ): RouteBuilder<TInput, any> {
    const output = this.routeBuilder.getOutputSchema();
    if ("extend" in output) {
      const extended = (output as any).extend(extension);
      return this.routeBuilder.output(extended);
    }
    throw new Error("Output schema does not support extend operation");
  }

  /**
   * Make output nullable
   */
  nullable(): RouteBuilder<TInput, z.ZodNullable<TOutput>> {
    const nullable = this.routeBuilder.getOutputSchema().nullable();
    return this.routeBuilder.output(nullable);
  }
}

/**
 * Helper function to create a route builder
 */
export function route(metadata?: RouteMetadata): RouteBuilder {
  return new RouteBuilder(metadata);
}
