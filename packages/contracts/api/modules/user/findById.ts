import { oc } from "@orpc/contract";
import { userSchema } from "@repo/api-contracts/common/user";
import z from "zod/v4";

export const userFindByIdInput = z.object({
  id: z.uuid(),
});

export const userFindByIdOutput = userSchema;

export const userFindByIdContract = oc
  .route({
    method: "GET",
    path: "/{id}",
    summary: "Get user by ID",
    description: "Retrieve a specific user by their ID",
  })
  .input(
    userFindByIdInput
  )
  .output(userSchema.nullable());