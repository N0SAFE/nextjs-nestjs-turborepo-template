import { z } from "zod";


// Auto-generated flags - DO NOT EDIT manually, these are synced by dr:build
export const page = true;
export const layout = true;
export const Route = {
  name: "Home",
  params: z.object({
  }),
  // Example: Define valid anchors for this route using z.enum
  // These can be used with: Home.Link({ anchor: 'features' })
  // or Home.immediate(router, undefined, undefined, 'features')
  anchors: z.enum(['features', 'about', 'contact']),
};

