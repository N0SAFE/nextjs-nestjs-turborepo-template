import * as z from "zod";
import type { CustomModifier } from "./types";

/**
 * Helper function to safely cast a ZodType to ZodObject for method access
 */
function asZodObject(schema: z.ZodType): z.ZodObject<z.ZodRawShape> | null {
  if (schema instanceof z.ZodObject) {
    return schema;
  }
  return null;
}

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
export class SchemaBuilder<TSchema extends z.ZodType> {
  constructor(private schema: TSchema) {}

  /**
   * Pick specific fields from an object schema
   */
  pick<T extends z.ZodObject<z.ZodRawShape>, K extends keyof z.infer<T>>(
    this: SchemaBuilder<T>,
    keys: readonly K[]
  ): SchemaBuilder<z.ZodObject<Pick<T["shape"], K & string>>> {
    const zodObj = asZodObject(this.schema);
    if (!zodObj) {
      throw new Error("pick() can only be called on object schemas");
    }
    const picked = zodObj.pick(
      Object.fromEntries(keys.map((k) => [k, true])) as Record<string, true>
    );
    return new SchemaBuilder(picked) as unknown as SchemaBuilder<z.ZodObject<Pick<T["shape"], K & string>>>;
  }

  /**
   * Omit specific fields from an object schema
   */
  omit<T extends z.ZodObject<z.ZodRawShape>, K extends keyof z.infer<T>>(
    this: SchemaBuilder<T>,
    keys: readonly K[]
  ): SchemaBuilder<z.ZodObject<Omit<T["shape"], K & string>>> {
    const zodObj = asZodObject(this.schema);
    if (!zodObj) {
      throw new Error("omit() can only be called on object schemas");
    }
    const omitted = zodObj.omit(
      Object.fromEntries(keys.map((k) => [k, true])) as Record<string, true>
    );
    return new SchemaBuilder(omitted) as unknown as SchemaBuilder<z.ZodObject<Omit<T["shape"], K & string>>>;
  }

  /**
   * Make all fields optional, or make specific fields optional if keys are provided
   */
  partial<T extends z.ZodObject<z.ZodRawShape>>(
    this: SchemaBuilder<T>,
    keys?: readonly (keyof z.infer<T>)[]
  ): SchemaBuilder<z.ZodObject<z.ZodRawShape>> {
    const zodObj = asZodObject(this.schema);
    if (!zodObj) {
      throw new Error("partial() can only be called on object schemas");
    }
    if (keys && keys.length > 0) {
      // Make only specific fields optional
      const shape = zodObj.shape as Record<string, z.ZodType>;
      const newShape: Record<string, z.ZodType> = {};
      
      for (const key of Object.keys(shape)) {
        const fieldSchema = shape[key];
        if (keys.includes(key as keyof z.infer<T>) && fieldSchema) {
          // Make this field optional
          newShape[key] = fieldSchema.optional();
        } else if (fieldSchema) {
          newShape[key] = fieldSchema;
        }
      }
      
      return new SchemaBuilder(z.object(newShape)) as unknown as SchemaBuilder<z.ZodObject<z.ZodRawShape>>;
    }
    return new SchemaBuilder(zodObj.partial()) as unknown as SchemaBuilder<z.ZodObject<z.ZodRawShape>>;
  }

  /**
   * Make all optional fields required, or make specific fields required if keys are provided
   */
  required<T extends z.ZodObject<z.ZodRawShape>>(
    this: SchemaBuilder<T>,
    keys?: readonly (keyof z.infer<T>)[]
  ): SchemaBuilder<z.ZodObject<z.ZodRawShape>> {
    const zodObj = asZodObject(this.schema);
    if (!zodObj) {
      throw new Error("required() can only be called on object schemas");
    }
    if (keys && keys.length > 0) {
      // Make only specific fields required
      const shape = zodObj.shape as Record<string, z.ZodType>;
      const newShape: Record<string, z.ZodType> = {};
      
      for (const key of Object.keys(shape)) {
        const originalFieldSchema = shape[key];
        if (keys.includes(key as keyof z.infer<T>) && originalFieldSchema) {
          // Unwrap optional/nullable and make required
          let fieldSchema: z.ZodType = originalFieldSchema;
          while (fieldSchema instanceof z.ZodOptional || fieldSchema instanceof z.ZodNullable) {
            fieldSchema = fieldSchema.unwrap() as z.ZodType;
          }
          newShape[key] = fieldSchema;
        } else if (originalFieldSchema) {
          newShape[key] = originalFieldSchema;
        }
      }
      
      return new SchemaBuilder(z.object(newShape)) as unknown as SchemaBuilder<z.ZodObject<z.ZodRawShape>>;
    }
    return new SchemaBuilder(zodObj.required()) as unknown as SchemaBuilder<z.ZodObject<z.ZodRawShape>>;
  }

  /**
   * Add default values to specific fields
   */
  addDefaults<T extends z.ZodObject<z.ZodRawShape>>(
    this: SchemaBuilder<T>,
    defaults: Partial<z.infer<T>>
  ): SchemaBuilder<z.ZodObject<z.ZodRawShape>> {
    const zodObj = asZodObject(this.schema);
    if (!zodObj) {
      throw new Error("addDefaults() can only be called on object schemas");
    }
    const shape = zodObj.shape as Record<string, z.ZodType>;
    const newShape: Record<string, z.ZodType> = {};
    
    for (const key of Object.keys(shape)) {
      const fieldSchema = shape[key];
      if (key in defaults && fieldSchema) {
        // Add default value to this field
        newShape[key] = fieldSchema.default(defaults[key as keyof typeof defaults]);
      } else if (fieldSchema) {
        newShape[key] = fieldSchema;
      }
    }
    
    return new SchemaBuilder(z.object(newShape)) as unknown as SchemaBuilder<z.ZodObject<z.ZodRawShape>>;
  }

  /**
   * Make specific fields accept null and undefined (nullish)
   */
  nullish<T extends z.ZodObject<z.ZodRawShape>>(
    this: SchemaBuilder<T>,
    keys: readonly (keyof z.infer<T>)[]
  ): SchemaBuilder<z.ZodObject<z.ZodRawShape>> {
    const zodObj = asZodObject(this.schema);
    if (!zodObj) {
      throw new Error("nullish() can only be called on object schemas");
    }
    const shape = zodObj.shape as Record<string, z.ZodType>;
    const newShape: Record<string, z.ZodType> = {};
    
    for (const key of Object.keys(shape)) {
      const fieldSchema = shape[key];
      if (keys.includes(key as keyof z.infer<T>) && fieldSchema) {
        // Make this field nullish (accepts null and undefined)
        newShape[key] = fieldSchema.nullish();
      } else if (fieldSchema) {
        newShape[key] = fieldSchema;
      }
    }
    
    return new SchemaBuilder(z.object(newShape)) as unknown as SchemaBuilder<z.ZodObject<z.ZodRawShape>>;
  }

  /**
   * Extend schema with additional fields
   */
  extend<T extends z.ZodObject<z.ZodRawShape>, TExtension extends z.ZodRawShape>(
    this: SchemaBuilder<T>,
    extension: TExtension
  ): SchemaBuilder<z.ZodObject<T["shape"] & TExtension>> {
    const zodObj = asZodObject(this.schema);
    if (!zodObj) {
      throw new Error("extend() can only be called on object schemas");
    }
    return new SchemaBuilder(zodObj.extend(extension)) as unknown as SchemaBuilder<z.ZodObject<T["shape"] & TExtension>>;
  }

  /**
   * Merge with another schema
   */
  merge<T extends z.ZodObject<z.ZodRawShape>, TOther extends z.ZodObject<z.ZodRawShape>>(
    this: SchemaBuilder<T>,
    other: TOther
  ): SchemaBuilder<z.ZodObject<T["shape"] & TOther["shape"]>> {
    const zodObj = asZodObject(this.schema);
    if (!zodObj) {
      throw new Error("merge() can only be called on object schemas");
    }
    return new SchemaBuilder(zodObj.extend(other.shape)) as unknown as SchemaBuilder<z.ZodObject<T["shape"] & TOther["shape"]>>;
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
  default(value: NonNullable<z.output<TSchema>>): SchemaBuilder<z.ZodDefault<TSchema>> {
    // Create a function that returns the value, bypassing NoUndefined constraint
    // The NonNullable in the parameter ensures undefined isn't passed
    const defaultFn = (): NonNullable<z.output<TSchema>> => value;
    // Use type assertion since we've validated the value is NonNullable
    const schemaWithDefault = (this.schema.default as (fn: () => z.output<TSchema>) => z.ZodDefault<TSchema>)(defaultFn);
    return new SchemaBuilder(schemaWithDefault);
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
  custom<TResult extends z.ZodType>(
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
export function schema<T extends z.ZodType>(
  zodSchema: T
): SchemaBuilder<T> {
  return new SchemaBuilder(zodSchema);
}
