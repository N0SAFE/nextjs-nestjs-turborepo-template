import { oc } from '@orpc/contract';
import z from 'zod/v4';

export const userDeleteInput = z.object({
    id: z.uuid(),
});

export const userDeleteOutput = z.discriminatedUnion("success", [
    z.object({
        success: z.literal(true),
    }),
    z.object({
        success: z.literal(false),
        message: z.string(),
    }),
]);

export const userDeleteContract = oc
  .route({
    method: "DELETE",
    path: "/{id}",
    summary: "Delete a user",
    description: "Remove a user from the system",
  })
  .input(userDeleteInput)
  .output(userDeleteOutput);
