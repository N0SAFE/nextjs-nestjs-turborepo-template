import type { appContract } from '@/lib/orpc'

// Test if contract has proper metadata
type UserContract = typeof appContract.user
type ListProcedure = UserContract['list']

// Check if the procedure has ~orpc metadata
type HasOrpc = ListProcedure extends { '~orpc': unknown } ? true : false

export interface Test {
  UserContract: UserContract
  ListProcedure: ListProcedure
  HasOrpc: HasOrpc
}
