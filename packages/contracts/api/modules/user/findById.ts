import { standard } from "@repo/orpc-utils";
import { userSchema } from "@repo/api-contracts/common/user";

// Create standard operations builder for users
const userOps = standard(userSchema, "user");

// Create read contract using builder
export const userFindByIdContract = userOps
  .read()
  .outputBuilder.nullable()
  .build();