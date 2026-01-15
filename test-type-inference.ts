import { z } from "zod/v4";
import { userListContract } from "./packages/contracts/api/modules/user/list";

// Check what type is inferred for the input schema
type InputSchema = typeof userListContract["~orpc"]['inputSchema'];
type InferredInput = z.infer<InputSchema>;

// This should show the actual input type structure
const test: InferredInput = {
  limit: 10,
  offset: 0,
  sortBy: "name",
  sortDirection: "asc",
};

console.log(test);
