import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { createORPCClientWithCookies } from './client'

// Create the base ORPC client (normal client-side client)
const baseClient = createORPCClientWithCookies();
export const orpc = createTanstackQueryUtils(baseClient);

export type ORPCClient = typeof orpc;