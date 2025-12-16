import { standard } from "@repo/orpc-utils";
import { userSchema } from "@repo/api-contracts/common/user";

// Create standard operations builder for users
const userOps = standard(userSchema, "user");

// Create create contract using builder
export const userCreateContract = userOps
  .create()
  .inputBuilder.pick(["name", "email", "image"])
  .build();
