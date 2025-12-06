import { standard } from "@repo/orpc-utils";
import { userSchema } from "@repo/api-contracts/common/user";

// Create standard operations builder for users
const userOps = standard(userSchema, "user");

// Create update contract using builder
export const userUpdateContract = userOps
  .update()
  .inputBuilder.partial()
  .inputBuilder.omit(["image"])
  .inputBuilder.extend({ id: userSchema.shape.id })
  .build();
