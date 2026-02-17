/**
 * Standard Operations - Unified Entry Point
 * 
 * Provides a single `standard` object with methods for different validation libraries.
 * Currently supports Zod-based standard operations.
 * 
 * @example
 * ```typescript
 * import { standard } from '@repo/orpc-utils';
 * import { z } from 'zod/v4';
 * 
 * const userSchema = z.object({
 *   id: z.uuid(),
 *   name: z.string(),
 *   email: z.string().email(),
 * });
 * 
 * // Create Zod-based standard operations
 * const userOps = standard.zod(userSchema, 'user');
 * 
 * // Use the operations
 * const readContract = userOps.read().build();
 * const listContract = userOps.list().build();
 * ```
 */

import { 
    ZodStandardOperations,
    zodStandard,
    createZodStandardOperations,
    type ZodEntitySchema,
    type ZodEntityOperationOptions,
} from "./zod/standard-operations";

/**
 * Standard operations factory object
 * Provides methods to create standard operations for different validation libraries
 */
export const standard = {
    /**
     * Create Zod-based standard operations
     * 
     * @param entitySchema - Zod object schema for the entity
     * @param entityName - Name of the entity (singular, e.g., 'user')
     * @param options - Optional configuration
     * @returns ZodStandardOperations instance
     * 
     * @example
     * ```typescript
     * const userOps = standard.zod(userSchema, 'user', {
     *   idField: 'id',
     *   idSchema: z.uuid(),
     *   timestamps: true,
     *   softDelete: true,
     * });
     * ```
     */
    zod: zodStandard,
};

// Re-export types and classes for direct usage
export {
    ZodStandardOperations,
    zodStandard,
    createZodStandardOperations,
    type ZodEntitySchema,
    type ZodEntityOperationOptions,
};

// Re-export list builder
export { ListOperationBuilder, createListConfig, createFilterConfig, type BuilderFilterField } from "./zod/list-builder";

// Re-export base types
export {
    StandardOperations as BaseStandardOperations,
    type EntityOperationOptions,
    type ListOperationOptions,
    type ListPlainOptions,
} from "./base/standard-operations";

// Re-export utilities
export * from "./zod/utils";
// Note: ./base/types and ./base/schema are not re-exported here to avoid conflicts
// They can be imported directly if needed from "./base/types" or "./base/schema"
