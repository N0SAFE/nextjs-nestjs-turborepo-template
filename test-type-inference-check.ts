import { z } from "zod/v4";
import { userListContract } from "./packages/contracts/api/modules/user/list";

// Test: z.infer should give us the actual input type, not unknown
type InferredInput = z.infer<typeof userListContract["~orpc"]['inputSchema']>;

// This assertion should pass if types are working - 
// if InferredInput is unknown, this would fail
type AssertNotUnknown<T> = unknown extends T ? never : T;
type TestResult = AssertNotUnknown<InferredInput>;

// If we can access properties, the type is correct
type HasLimit = InferredInput extends { limit?: number } ? true : false;
const checkHasLimit: HasLimit = true;

// Export to prevent unused variable errors
export type { TestResult, HasLimit };
