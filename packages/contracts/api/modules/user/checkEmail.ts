import { oc } from "@orpc/contract";
import { z } from "zod/v4";

export const userCheckEmailInput = z.object({
  email: z.email(),
});

export const userCheckEmailOutput = z.object({
  exists: z.boolean(),
});

export const userCheckEmailContract = oc
  .route({
    method: "POST",
    path: "/check-email",
    summary: "Check if email exists",
    description: "Check if a user with the given email already exists",
  })
  .input(userCheckEmailInput)
  .output(userCheckEmailOutput);
