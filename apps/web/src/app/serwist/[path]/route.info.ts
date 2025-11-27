import { z } from "zod";

export const Route = {
  name: "SerwistPath",
  params: z.object({
    path: z.string(),
  })
};

