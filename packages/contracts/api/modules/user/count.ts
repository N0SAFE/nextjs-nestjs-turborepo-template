import { oc } from "@orpc/contract";
import { countOutput } from "@repo/api-contracts/common/utils/count";
import { z } from "zod/v4";

export const userCountInput = z.object({});

export const userCountOutput = z.object({
  count: countOutput,
});

export const userCountContract = oc
  .route({
    method: "GET",
    path: "/count",
    summary: "Get user count",
    description: "Get the total number of users in the system",
  })
  .input(userCountInput)
  .output(userCountOutput);
