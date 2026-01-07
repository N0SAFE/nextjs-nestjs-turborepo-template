import { z } from "zod";


// Auto-generated flags - DO NOT EDIT manually, these are synced by dr:build
export const page = true;
export const layout = false;
export const Route = {
  name: "InternalMiddlewareErrorHealthCheck",
  params: z.object({
  }),
  search: z.object({
    json: z.string().optional(),
    from: z.string().optional(),
  }),
};
