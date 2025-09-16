import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { createORPCClientWithCookies } from './client'
import { createServerORPCClient } from './server'

// Create the base ORPC client (normal client-side client)
const baseClient = createORPCClientWithCookies();
export const orpc = createTanstackQueryUtils(baseClient);

// Export server client factory 
export { createServerORPCClient as orpcServer };

export type ORPCClient = typeof orpc;