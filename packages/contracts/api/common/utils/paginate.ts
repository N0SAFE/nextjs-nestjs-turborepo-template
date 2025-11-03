import z from "zod/v4";

export const paginatedInput = z.object({
  limit: z.coerce.number().int().positive().max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

export const paginatedOutput = z.object({
  total: z.coerce.number(),
  limit: z.coerce.number(),
  offset: z.coerce.number(),
  hasMore: z.boolean(),
});
