import { z } from 'zod/v4';

/**
 * Simple Zod schema to JSON schema converter (basic implementation; extend for complex types).
 * @param schema - Zod schema to convert
 * @returns JSON schema object
 */
export function zodToJsonSchema(schema: z.ZodTypeAny): any {
  if (schema instanceof z.ZodObject) {
    const properties = Object.fromEntries(
      Object.entries(schema.shape).map(([key, sch]) => [key, zodToJsonSchema(sch as z.ZodTypeAny)])
    );
    const required = Object.keys(schema.shape).filter(key => !schema.shape[key].isOptional());
    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  } else if (schema instanceof z.ZodString) {
    const stringConstraints: Record<string, number> = {};
    if (schema._def.checks) {
      for (const check of schema._def.checks) {
        if ((check as any).kind === 'min') stringConstraints.minLength = (check as any).value;
        if ((check as any).kind === 'max') stringConstraints.maxLength = (check as any).value;
      }
    }
    return { type: 'string', ...stringConstraints };
  } else if (schema instanceof z.ZodNumber) {
    const numberConstraints: Record<string, number> = {};
    if (schema._def.checks) {
      for (const check of schema._def.checks) {
        if ((check as any).kind === 'min') numberConstraints.minimum = (check as any).value;
        if ((check as any).kind === 'max') numberConstraints.maximum = (check as any).value;
      }
    }
    return { type: 'number', ...numberConstraints };
  } else if (schema instanceof z.ZodBoolean) {
    return { type: 'boolean' };
  } else if (schema instanceof z.ZodArray) {
    const arraySchema = schema as z.ZodArray<z.ZodTypeAny>;
    const itemSchema = (arraySchema._def as any).type || (arraySchema as any).element;
    return { type: 'array', items: zodToJsonSchema(itemSchema) };
  } else if (schema instanceof z.ZodEnum) {
    const enumSchema = schema as unknown as { _def: { values: readonly unknown[] } };
    return { type: 'string', enum: Array.from(enumSchema._def.values) };
  } else if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    const unwrappableSchema = schema as unknown as { unwrap(): z.ZodTypeAny };
    return zodToJsonSchema(unwrappableSchema.unwrap());
  } // Add more Zod types as needed (union, literal, etc.)
  return { type: 'unknown' };
}

/**
 * Extract schema from ORPC contract route.
 * @param contract - ORPC contract object
 * @param route - Route name
 * @returns Input/output schemas as JSON
 */
export function extractOrpcSchema(contract: any, route: string) {
  const routeDef = contract.routes?.[route];
  if (!routeDef) throw new Error(`Route ${route} not found in contract`);
  return {
    input: routeDef.input ? zodToJsonSchema(routeDef.input) : null,
    output: routeDef.output ? zodToJsonSchema(routeDef.output) : null,
    method: routeDef.method,
    path: routeDef.path,
  };
}
