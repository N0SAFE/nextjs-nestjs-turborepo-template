import { standard } from "@repo/orpc-utils";
import { userSchema } from "@repo/api-contracts/common/user";
import z from "zod/v4";

// Create standard operations builder for users
const userOps = standard.zod(userSchema, "user");

// Check what type entitySchema has
const readBuilder = userOps.read();

// What is the inferred type of entitySchema?
type ReadBuilderType = typeof readBuilder;
type EntitySchemaType = ReadBuilderType extends {
  getEntitySchema(): infer E;
}
  ? E
  : never;

// Let's see what happens when we access entitySchema in the output callback
const contract = userOps.read().output(b => {
  // What is the type of b.entitySchema?
  type BEntitySchema = typeof b.entitySchema;
  
  // Try to use it
  return b.entitySchema.nullable();
}).build();

console.log("Test completed");
