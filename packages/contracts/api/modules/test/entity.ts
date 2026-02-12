import * as z from "zod";

/**
 * Test entity schema for demonstrating ORPC contract builder
 * This is a simple entity with common fields for testing purposes
 */
export const testEntitySchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]),
  priority: z.number().int().min(1).max(5).default(3),
  tags: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TestEntity = z.infer<typeof testEntitySchema>;

/**
 * Test entity input schema (for create/update operations)
 * Omits auto-generated fields like id, createdAt, updatedAt
 */
export const testEntityInputSchema = testEntitySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TestEntityInput = z.infer<typeof testEntityInputSchema>;
