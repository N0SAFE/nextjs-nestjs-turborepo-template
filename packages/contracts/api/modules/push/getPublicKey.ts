import { oc } from "@orpc/contract";
import { z } from "zod";

export const getPublicKeyOutputSchema = z.object({
  publicKey: z.string(),
});

export const getPublicKeyContract = oc
  .output(getPublicKeyOutputSchema)
  .route({
    method: "GET",
    path: "/public-key",
    summary: "Get VAPID public key",
    description: "Get the current user's VAPID public key for push notifications",
  });
