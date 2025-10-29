import { oc } from "@orpc/contract";
import { z } from "zod/v4";
import { paginatedInput, paginatedOutput } from "@repo/api-contracts/common/utils/paginate";
import { userSchema } from "@repo/api-contracts/common/user";
import { sortBy } from "@repo/api-contracts/common/utils/sortBy";

// oh boy don't do this
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never
type LastOf<T> =
  UnionToIntersection<T extends any ? () => T : never> extends () => (infer R) ? R : never

// TS4.0+
type Push<T extends any[], V> = [...T, V];

// TS4.1+
type TuplifyUnion<T, L = LastOf<T>, N = [T] extends [never] ? true : false> =
  true extends N ? [] : Push<TuplifyUnion<Exclude<T, L>>, L>

// Define the input for the list endpoint
export const userListInput = z.object({
  pagination: paginatedInput,
  sort: z.object({
    field: z.enum(Object.keys(userSchema.shape) as [keyof typeof userSchema['shape'], ...TuplifyUnion<(keyof typeof userSchema['shape'])>]),
    direction: z.enum(['asc', 'desc']),
  }).optional(),
  filter: z.object({
    id: userSchema.shape.id,
    email: userSchema.shape.email,
    name: userSchema.shape.name,
    // Add more fields as needed
  }).partial().optional(),
});

// Define the output for the list endpoint
export const userListOutput = z.object({
  users: z.array(userSchema),
  meta: z.object({ pagination: paginatedOutput }),
});

// Define the contract
export const userListContract = oc
  .route({
    method: "GET",
    path: "/",
    summary: "Get all users",
    description:
      "Retrieve a paginated list of users with optional filtering and sorting",
  })
  .input(userListInput)
  .output(userListOutput);
