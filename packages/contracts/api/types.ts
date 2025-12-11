/**
 * Helper types to extract input/output types from ORPC contracts
 * These types help with TypeScript inference when working with contracts
 */

import type { userSchema } from "./common/user";
import type { z } from "zod/v4";

// Base user type
export type User = z.infer<typeof userSchema>;

// NOTE: UserListInput is now exported from ./modules/user/list.ts
// It's automatically inferred from the contract builder config

// User List Output
export type UserListOutput = {
  data: User[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

// User Create Input
export type UserCreateInput = Pick<User, "name" | "email" | "image">;

// User Update Input
export type UserUpdateInput = Partial<Omit<User, "image">> & { id: string };

// User FindById Input
export type UserFindByIdInput = { id: string };

// User Delete Input
export type UserDeleteInput = { id: string };

// User Delete Output
export type UserDeleteOutput = {
  success: boolean;
  message?: string;
};

// User CheckEmail Input
export type UserCheckEmailInput = { email: string };

// User CheckEmail Output
export type UserCheckEmailOutput = { exists: boolean };

// User Count Output
export type UserCountOutput = { count: number };
