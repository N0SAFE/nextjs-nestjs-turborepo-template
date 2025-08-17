import { createORPCClient, onError } from '@orpc/client';
import { type AppContract, appContract } from '@repo/api-contracts';
import { OpenAPILink } from '@orpc/openapi-client/fetch'
import { ContractRouterClient } from '@orpc/contract'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { validateEnvPath } from '#/env';

const APP_URL = validateEnvPath(process.env.NEXT_PUBLIC_APP_URL!, 'NEXT_PUBLIC_APP_URL')

const link = new OpenAPILink(appContract, {
  // Use API_URL directly for server-side requests, APP_URL with /api/nest for client-side
  url: typeof window === 'undefined' ? validateEnvPath(process.env.API_URL!, 'API_URL') : `${APP_URL}/api/nest`,
  headers: ({context}) => ({
    cookie: context.cookie || '',
  }),
  interceptors: [
    onError((error) => {
      console.error(error)
    })
  ],
})

// Create the base ORPC client
export const orpcServer = createORPCClient<ContractRouterClient<AppContract>>(link);

// Create the TanStack Query utils for React components
export const orpc = createTanstackQueryUtils(orpcServer);

export type ORPCClient = typeof orpc;