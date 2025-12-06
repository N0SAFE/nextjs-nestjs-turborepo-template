import { standard } from "@repo/orpc-utils";
import { userSchema } from "@repo/api-contracts/common/user";

// Create standard operations builder for users
const userOps = standard(userSchema, "user");

// Create enhanced list contract with comprehensive query utilities
export const userListContract = userOps.list({
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
    includeOffset: true,
  },
  sorting: ["createdAt", "name", "email", "updatedAt"] as const,
  filtering: {
    fields: {
      id: userSchema.shape.id,
      email: { schema: userSchema.shape.email, operators: ["eq", "like", "ilike"] },
      name: { schema: userSchema.shape.name, operators: ["eq", "like", "ilike"] },
      emailVerified: userSchema.shape.emailVerified,
      createdAt: { 
        schema: userSchema.shape.createdAt, 
        operators: ["gt", "gte", "lt", "lte", "between"]
      },
    }
  }
}).build();
