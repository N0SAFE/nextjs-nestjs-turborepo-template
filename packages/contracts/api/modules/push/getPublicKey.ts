import { route } from "@repo/orpc-utils/builder";
import * as z from "zod";

export const getPublicKeyOutputSchema = z.object({
  publicKey: z.string(),
});

export const getPublicKeyContract = route({
    method: "GET",
    path: "/public-key",
    summary: "Get VAPID public key",
    description: "Get the current user's VAPID public key for push notifications",
  })
  .output(getPublicKeyOutputSchema)
  .build();
