import { z } from "zod/v4";
import { oc, InferSchemaInput, InferSchemaOutput } from "@orpc/contract";

// ========================================
// PART 1: Basic z.infer tests (should pass)
// ========================================

// Test 1: z.infer with z.ZodType<T> wrapper
type Test1 = z.infer<z.ZodType<{ foo: string }>>
type HasFoo = Test1 extends { foo: string } ? true : false;
const check1: HasFoo = true;

// Test 2: Direct ZodObject
const directZodSchema = z.object({ bar: z.string() });
type Test2 = z.infer<typeof directZodSchema>;
type HasBar = Test2 extends { bar: string } ? true : false;
const check2: HasBar = true;

// ========================================
// PART 2: Examine ORPC's type behavior
// ========================================

// Create a simple contract
const simpleSchema = z.object({ limit: z.number() });
const simpleContract = oc.input(simpleSchema).output(z.object({ data: z.string() }));

// What is the stored inputSchema type?
type StoredInputSchema = typeof simpleContract["~orpc"]["inputSchema"];

// Test 3: Using ORPC's InferSchemaInput (this WORKS!)
type ORPCInferred = InferSchemaInput<NonNullable<StoredInputSchema>>;
type Check3 = ORPCInferred extends { limit: number } ? true : false;
const check3: Check3 = true; // ✅ This WORKS

// Test 4: Using z.infer (this FAILS!)
type ZodInferred = z.infer<NonNullable<StoredInputSchema>>;
type Check4 = ZodInferred extends { limit: number } ? true : false;
const check4: Check4 = true; // ❌ This should FAIL

// ========================================
// PART 3: Debug - Compare the two approaches
// ========================================

// @ts-expect-error - show what ORPC's InferSchemaInput produces
const debug1: "SHOW" = null as ORPCInferred;

// @ts-expect-error - show what z.infer produces
const debug2: "SHOW" = null as ZodInferred;

// @ts-expect-error - show the stored schema type
const debug3: "SHOW" = null as NonNullable<StoredInputSchema>;

export { check1, check2, check3, check4 };
