import { standard } from "@repo/orpc-utils";
import { userSchema } from "@repo/api-contracts/common/user";

// Create standard operations builder for users
const userOps = standard.zod(userSchema, "user");

// Create read contract using builder
export const userFindByIdContract = userOps
  .read()
  .output(b => b.entitySchema.nullable())
  .build()
  
  type i = typeof userFindByIdContract['~orpc']["inputSchema"];
  type o = typeof userFindByIdContract['~orpc']["outputSchema"];