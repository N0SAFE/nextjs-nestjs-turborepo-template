import { standard } from "@repo/orpc-utils";
import { userSchema } from "@repo/api-contracts/common/user";

// Create standard operations builder for users
const userOps = standard.zod(userSchema, "user");

// Create count contract using builder
export const userCountContract = userOps.count().build();
