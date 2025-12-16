import { oc } from "@orpc/contract";
import { userContract, healthContract, pushContract, testContract } from "./modules/index";

// Main app contract that combines all feature contracts
export const appContract = oc.router({
  user: userContract,
  health: healthContract,
  push: pushContract,
  test: testContract,
});

export type AppContract = typeof appContract;

// Re-export individual contracts and schemas
export * from "./modules/index";
export * from "./types";
