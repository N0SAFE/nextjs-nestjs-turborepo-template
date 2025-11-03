import { oc } from "@orpc/contract";


// Import all contract definitions
import { userListContract } from './list';
import { userFindByIdContract } from './findById';
import { userCreateContract } from './create';
import { userUpdateContract } from './update';
import { userDeleteContract } from './delete';
import { userCheckEmailContract } from './checkEmail';
import { userCountContract } from './count';

// Combine into main user contract
export const userContract = oc.tag("User").prefix("/user").router({
  list: userListContract,
  findById: userFindByIdContract,
  create: userCreateContract,
  update: userUpdateContract,
  delete: userDeleteContract,
  checkEmail: userCheckEmailContract,
  count: userCountContract,
});

export type UserContract = typeof userContract;

// Re-export everything from individual contracts
export * from './list';
export * from './findById';
export * from './create';
export * from './update';
export * from './delete';
export * from './checkEmail';
export * from './count';
