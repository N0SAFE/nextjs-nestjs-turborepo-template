import { z } from "zod/v4";
import {
  standard,
  createSortingConfigSchema,
  createPaginationConfigSchema,
  createFilteringConfigSchema,
  defineQueryConfig,
  type ComputeInputSchema,
  type ComputeOutputSchema,
} from "@repo/orpc-utils";
import { testEntitySchema, testEntityInputSchema } from "./entity";

// ============================================================================
// Test Entity Standard Operations using ORPC Contract Builder
// ============================================================================

// Define sorting fields available for list/search operations
const sortingFieldsArray = ["createdAt", "updatedAt", "name", "priority", "status"] as const;

// Create pagination config schema
const paginationConfigSchema = createPaginationConfigSchema({
  defaultLimit: 10,
  maxLimit: 50,
  includeOffset: true,
} as const);

// Create sorting config schema
const sortingConfigSchema = createSortingConfigSchema(sortingFieldsArray, {
  defaultField: "createdAt",
  defaultDirection: "desc",
});

// Create filtering config schema with field-specific operators
const filteringConfigSchema = createFilteringConfigSchema({
  id: testEntitySchema.shape.id,
  name: {
    schema: testEntitySchema.shape.name,
    operators: ["eq", "like", "ilike"] as const,
  },
  status: {
    schema: testEntitySchema.shape.status,
    operators: ["eq", "in"] as const,
  },
  priority: {
    schema: testEntitySchema.shape.priority,
    operators: ["eq", "gt", "gte", "lt", "lte"] as const,
  },
  createdAt: {
    schema: testEntitySchema.shape.createdAt,
    operators: ["gt", "gte", "lt", "lte", "between"] as const,
  },
});

// Export configuration schemas for reuse
export const testEntityListConfigSchemas = defineQueryConfig({
  pagination: paginationConfigSchema,
  sorting: sortingConfigSchema,
  filtering: filteringConfigSchema,
});

// Create standard operations builder for test entities
const testOps = standard(testEntitySchema, "testEntity");

// ============================================================================
// Standard CRUD Operations
// ============================================================================

/**
 * List test entities with pagination, sorting, and filtering
 */
export const testEntityListContract = testOps.list(testEntityListConfigSchemas).build();
export type TestEntityListInput = ComputeInputSchema<typeof testEntityListConfigSchemas>;
export type TestEntityListOutput = ComputeOutputSchema<typeof testEntityListConfigSchemas, typeof testEntitySchema>;

/**
 * Find a single test entity by ID
 * Uses the `read()` method which creates a GET /{id} endpoint
 */
export const testEntityFindByIdContract = testOps.read().build();
export type TestEntityFindByIdInput = { id: string };
export type TestEntityFindByIdOutput = z.infer<typeof testEntitySchema>;

/**
 * Create a new test entity
 * Uses the entity schema as input, customize with inputBuilder if needed
 */
export const testEntityCreateContract = testOps
  .create()
  .input(testEntityInputSchema)
  .build();
export type TestEntityCreateInput = z.infer<typeof testEntityInputSchema>;
export type TestEntityCreateOutput = z.infer<typeof testEntitySchema>;

/**
 * Update an existing test entity
 * Uses partial entity schema for updates
 */
export const testEntityUpdateContract = testOps
  .update()
  .input(testEntityInputSchema.partial())
  .build();
export type TestEntityUpdateInput = Partial<z.infer<typeof testEntityInputSchema>>;
export type TestEntityUpdateOutput = z.infer<typeof testEntitySchema>;

/**
 * Delete a test entity by ID
 */
export const testEntityDeleteContract = testOps.delete().build();
export type TestEntityDeleteInput = { id: string };
export type TestEntityDeleteOutput = { success: boolean };

/**
 * Count test entities (with optional filtering)
 */
export const testEntityCountContract = testOps.count().build();
export type TestEntityCountOutput = { count: number };

// ============================================================================
// Streaming Operations (demonstrating the new RouteBuilder wrapper feature)
// ============================================================================

/**
 * Streaming list of test entities
 * Uses the new RouteBuilder.wrapOutput(eventIterator) pattern
 * Supports both live (replace) and streamed (accumulate) consumption modes
 */
export const testEntityStreamingListContract = testOps
  .streamingList({
    pagination: paginationConfigSchema,
    sorting: sortingConfigSchema,
    path: "/streaming",
  })
  .build();

/**
 * Streaming read of a single test entity by ID
 * Real-time updates for a specific entity via EventIterator
 * - Live mode: Always shows the current state of the entity
 * - Streamed mode: Accumulates history of entity states/changes
 */
export const testEntityStreamingReadContract = testOps
  .streamingRead({
    path: "/{id}/streaming",
  })
  .build();
export type TestEntityStreamingReadInput = { id: string };
export type TestEntityStreamingReadOutput = z.infer<typeof testEntitySchema>;

// ============================================================================
// Check Operation (demonstrating field validation)
// ============================================================================

/**
 * Check if a test entity name exists
 */
export const testEntityCheckNameContract = testOps
  .check("name", z.string().min(1))
  .build();
export type TestEntityCheckNameInput = { name: string };
export type TestEntityCheckNameOutput = { exists: boolean };

// ============================================================================
// Search Operation
// ============================================================================

/**
 * Search test entities by name and description
 */
export const testEntitySearchContract = testOps
  .search({
    searchFields: ["name", "description"] as const,
    pagination: paginationConfigSchema,
  })
  .build();
