import { z } from 'zod';

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
    return { type: 'string', ... (schema._def.checks?.reduce((acc, check) => {
      if (check.kind === 'min') acc.minLength = check.value;
      if (check.kind === 'max') acc.maxLength = check.value;
      return acc;
    }, {} as any) || {}) };
  } else if (schema instanceof z.ZodNumber) {
    return { type: 'number', ... (schema._def.checks?.reduce((acc, check) => {
      if (check.kind === 'min') acc.minimum = check.value;
      if (check.kind === 'max') acc.maximum = check.value;
      return acc;
    }, {} as any) || {}) };
  } else if (schema instanceof z.ZodBoolean) {
    return { type: 'boolean' };
  } else if (schema instanceof z.ZodArray) {
    return { type: 'array', items: zodToJsonSchema(schema.element) };
  } else if (schema instanceof z.ZodEnum) {
    return { type: 'string', enum: schema._def.values };
  } else if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return zodToJsonSchema(schema.unwrap());
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
