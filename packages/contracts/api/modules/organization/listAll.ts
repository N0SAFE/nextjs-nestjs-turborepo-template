import * as z from "zod";
import { 
  standard,
  type ComputeInputSchema,
} from "@repo/orpc-utils";

// Define organization Zod schema based on the database structure
const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().nullable(),
  createdAt: z.date(),
  metadata: z.string().nullable(),
});

// Create standard operations builder
const organizationOps = standard.zod(organizationSchema, "organization");

// Use the fluent list builder API
const organizationListAllBuilder = organizationOps
  .listBuilder()
  .withPagination({
    defaultLimit: 20,
    maxLimit: 100,
    includeOffset: true,
  } as const)
  .withSorting(["createdAt", "name", "slug"] as const, {
    defaultField: "createdAt",
    defaultDirection: "desc",
  })
  .withFiltering({
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

// Export reusable query configuration schemas
export const organizationListAllConfigSchemas = organizationListAllBuilder.getSchemas();

// Build the list contract
export const organizationListAllContract = organizationListAllBuilder.build();

// Export input type helper - computed from the config
export type OrganizationListAllInput = ComputeInputSchema<typeof organizationListAllConfigSchemas>;
