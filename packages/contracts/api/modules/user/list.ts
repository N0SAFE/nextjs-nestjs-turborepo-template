import { z } from "zod/v4";
import { oc } from "@orpc/contract";
import { standard, createSortingConfigSchema, createPaginationConfigSchema, createFilteringConfigSchema, defineQueryConfig, type ComputeInputSchema, type QueryConfig } from "@repo/orpc-utils";
import { userSchema } from "@repo/api-contracts/common/user";
import { ContractProcedureDef, InferSchemaInput } from "@orpc/contract";

// Define sorting fields
const sortingFieldsArray = ["createdAt", "name", "email", "updatedAt"] as const;

// Create pagination config schema - carries both the Zod schema and runtime config
const paginationConfigSchema = createPaginationConfigSchema({
    defaultLimit: 20,
    maxLimit: 100,
    includeOffset: true,
} as const);

// Create sorting config schema - type-safe with available fields
const sortingConfigSchema = createSortingConfigSchema(sortingFieldsArray, {
    defaultField: "createdAt",
    defaultDirection: "desc",
});

// Define filtering configuration with field-specific schemas and operators
const filteringConfigSchema = createFilteringConfigSchema({
    id: userSchema.shape.id,
    email: {
        schema: userSchema.shape.email,
        operators: ["eq", "like", "ilike"] as const,
    },
    name: {
        schema: userSchema.shape.name,
        operators: ["eq", "like", "ilike"] as const,
    },
    emailVerified: userSchema.shape.emailVerified,
    createdAt: {
        schema: userSchema.shape.createdAt,
        operators: ["gt", "gte", "lt", "lte", "between"] as const,
    },
});

type a = z.infer<typeof sortingConfigSchema>;

// Export configuration schemas for reuse and validation
export const userListConfigSchemas = defineQueryConfig({
    pagination: paginationConfigSchema,
    sorting: sortingConfigSchema,
    filtering: filteringConfigSchema,
});

// Create standard operations builder for users
const userOps = standard(userSchema, "user");

// Create enhanced list contract - Zod schemas with attached configs
export const userListContract = userOps.list(userListConfigSchemas).build();

// Infer the input type directly from the config using the ComputeInputSchema type helper
export type UserListInput = ComputeInputSchema<typeof userListConfigSchemas>;