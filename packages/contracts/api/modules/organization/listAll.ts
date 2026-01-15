import { z } from "zod/v4";
import { 
  standard,
  createSortingConfigSchema,
  createPaginationConfigSchema,
  createFilteringConfigSchema,
  defineQueryConfig,
  type ComputeInputSchema,
  type QueryConfig,
} from "@repo/orpc-utils";

// Define organization schema based on Better Auth's organization structure
const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  metadata: z.string().nullable().optional(),
});

// Define sorting fields
const sortingFieldsArray = ["createdAt", "name", "slug", "updatedAt"] as const;

// Create pagination config schema
const paginationConfigSchema = createPaginationConfigSchema({
  defaultLimit: 20,
  maxLimit: 100,
  includeOffset: true,
} as const);

// Create sorting config schema
const sortingConfigSchema = createSortingConfigSchema(sortingFieldsArray, {
  defaultField: "createdAt",
  defaultDirection: "desc",
});

// Define filtering configuration
const filteringConfigSchema = createFilteringConfigSchema({
  id: organizationSchema.shape.id,
  name: {
    schema: organizationSchema.shape.name,
    operators: ["eq", "like", "ilike"] as const,
  },
  slug: {
    schema: organizationSchema.shape.slug,
    operators: ["eq", "like", "ilike"] as const,
  },
  createdAt: {
    schema: organizationSchema.shape.createdAt,
    operators: ["gt", "gte", "lt", "lte", "between"] as const,
  },
});

// Export configuration schemas
export const organizationListAllConfigSchemas = defineQueryConfig({
  pagination: paginationConfigSchema,
  sorting: sortingConfigSchema,
  filtering: filteringConfigSchema,
});

// Create standard operations builder
const organizationOps = standard(organizationSchema, "organization");

// Create list all contract (admin-only, lists all organizations)
export const organizationListAllContract = organizationOps.list(organizationListAllConfigSchemas).build();

// Infer input type
export type OrganizationListAllInput = ComputeInputSchema<typeof organizationListAllConfigSchemas>;
