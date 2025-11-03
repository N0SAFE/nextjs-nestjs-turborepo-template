import { oc } from "@orpc/contract";
import { userSchema } from "@repo/api-contracts/common/user";
import { z } from "zod/v4";

export const userCreateInput = z.object({
  name: userSchema.shape.name,
  email: userSchema.shape.email,
  image: userSchema.shape.image,
});

export const userCreateOutput = userSchema

export const userCreateContract = oc
  .route({
    method: "POST",
    path: "/",
    summary: "Create a new user",
    description: "Create a new user in the system",
  })
  .input(userCreateInput)
  .output(userCreateOutput);
