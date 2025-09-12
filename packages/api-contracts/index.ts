import { oc } from "@orpc/contract";
import { userContract, healthContract, devAuthContract } from "./modules/index";

// Main app contract that combines all feature contracts
export const appContract = oc.router({
  user: userContract,
  health: healthContract,
  devAuth: devAuthContract,
});

export type AppContract = typeof appContract;

// Re-export individual contracts and schemas
export * from "./modules/index";
