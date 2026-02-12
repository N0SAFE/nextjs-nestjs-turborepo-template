import * as z from "zod";
import { 
  standard,
  type ComputeInputSchema,
} from "@repo/orpc-utils";

// Define member Zod schema based on the database table structure
const memberSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  role: z.string(),
  createdAt: z.date(),
  // Relations
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    image: z.string().nullable(),
  }).optional(),
});

// Define sorting fields
const sortingFieldsArray = ["createdAt", "role"] as const;

// Create standard operations builder
const memberOps = standard.zod(memberSchema, "member");

// Create list members contract using fluent builder
const listMembersBuilder = memberOps
  .listBuilder()
  .withPagination({
    defaultLimit: 20,
    maxLimit: 100,
    includeOffset: true,
  })
  .withSorting(sortingFieldsArray, {
    defaultField: "createdAt",
    defaultDirection: "desc",
  })
  .withFiltering({
    organizationId: memberSchema.shape.organizationId,
    userId: memberSchema.shape.userId,
    role: {
      schema: memberSchema.shape.role,
      operators: ["eq"] as const,
    },
  });

export const organizationListMembersContract = listMembersBuilder.build();

// Infer input type
type ListMembersConfig = typeof listMembersBuilder extends { queryBuilder: { config: infer C } } ? C : never;
export type OrganizationListMembersInput = ComputeInputSchema<ListMembersConfig>;
