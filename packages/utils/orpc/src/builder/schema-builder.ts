import { z } from "zod/v4";
import type { EntitySchema, CustomModifier } from "./types";

/**
 * Schema builder for customizing input/output schemas with a fluent API
 * 
 * @example
 * ```typescript
 * const inputSchema = new SchemaBuilder(userSchema)
 *   .pick(['name', 'email'])
 *   .extend({ role: z.string() })
 *   .custom((schema) => schema.partial())
 *   .build();
 * ```
 */
export class SchemaBuilder<TSchema extends z.ZodTypeAny> {
  constructor(private schema: TSchema) {}

  /**
   * Pick specific fields from an object schema
   */
  pick<T extends z.ZodObject<any>, K extends keyof z.infer<T>>(
    this: SchemaBuilder<T>,
    keys: readonly K[]
  ): SchemaBuilder<z.ZodObject<Pick<T["shape"], K & string>>> {
    const picked = (this.schema as any).pick(
      Object.fromEntries(keys.map((k) => [k, true]))
    );
    return new SchemaBuilder(picked);
  }

  /**
   * Omit specific fields from an object schema
   */
  omit<T extends z.ZodObject<any>, K extends keyof z.infer<T>>(
    this: SchemaBuilder<T>,
    keys: readonly K[]
  ): SchemaBuilder<z.ZodObject<Omit<T["shape"], K & string>>> {
    const omitted = (this.schema as any).omit(
      Object.fromEntries(keys.map((k) => [k, true]))
    );
    return new SchemaBuilder(omitted);
  }

  /**
   * Make all fields optional
   */
  partial<T extends z.ZodObject<any>>(
    this: SchemaBuilder<T>
  ): SchemaBuilder<z.ZodObject<{ [K in keyof T["shape"]]: z.ZodOptional<T["shape"][K]> }>> {
    return new SchemaBuilder((this.schema as any).partial());
  }

  /**
   * Make all fields required
   */
  required<T extends z.ZodObject<any>>(
    this: SchemaBuilder<T>
  ): SchemaBuilder<z.ZodObject<any>> {
    return new SchemaBuilder((this.schema as any).required());
  }

  /**
   * Extend schema with additional fields
   */
  extend<T extends z.ZodObject<any>, TExtension extends z.ZodRawShape>(
    this: SchemaBuilder<T>,
    extension: TExtension
  ): SchemaBuilder<z.ZodObject<T["shape"] & TExtension>> {
    return new SchemaBuilder((this.schema as any).extend(extension));
  }

  /**
   * Merge with another schema
   */
  merge<T extends z.ZodObject<any>, TOther extends z.ZodObject<any>>(
    this: SchemaBuilder<T>,
    other: TOther
  ): SchemaBuilder<z.ZodObject<T["shape"] & TOther["shape"]>> {
    return new SchemaBuilder((this.schema as any).merge(other));
  }

  /**
   * Make the schema nullable
   */
  nullable(): SchemaBuilder<z.ZodNullable<TSchema>> {
    return new SchemaBuilder(this.schema.nullable());
  }

  /**
   * Make the schema optional
   */
  optional(): SchemaBuilder<z.ZodOptional<TSchema>> {
    return new SchemaBuilder(this.schema.optional());
  }

  /**
   * Add a default value
   */
  default<T extends z.ZodTypeAny>(
    this: SchemaBuilder<T>,
    value: z.infer<T>
  ): SchemaBuilder<z.ZodDefault<T>> {
    return new SchemaBuilder((this.schema as any).default(value));
  }

  /**
   * Add a description
   */
  describe(description: string): SchemaBuilder<TSchema> {
    return new SchemaBuilder(this.schema.describe(description));
  }

  /**
   * Apply custom transformations
   */
  custom<TResult extends z.ZodTypeAny>(
    modifier: CustomModifier<TSchema, TResult>
  ): SchemaBuilder<TResult> {
    return new SchemaBuilder(modifier(this.schema));
  }

  /**
   * Build and return the final schema
   */
  build(): TSchema {
    return this.schema;
  }

  /**
   * Get the current schema without building
   */
  getSchema(): TSchema {
    return this.schema;
  }
}

/**
 * Helper function to create a schema builder
 */
export function schema<T extends z.ZodTypeAny>(
  zodSchema: T
): SchemaBuilder<T> {
  return new SchemaBuilder(zodSchema);
}
