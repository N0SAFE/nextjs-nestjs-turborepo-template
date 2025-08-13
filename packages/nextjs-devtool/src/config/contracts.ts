/**
 * DevTool Core Contracts
 * 
 * Defines the ORPC contracts for core DevTool functionality and exports
 * contracts from all plugins for easy access.
 */

import { oc } from '@orpc/contract';
import { z } from 'zod';

// Core DevTool contract inputs and outputs
export const devToolStatusInput = z.object({});

export const devToolStatusOutput = z.object({
  mode: z.string(),
  plugins: z.number(),
  timestamp: z.number(),
});

export const devToolReloadInput = z.object({});

export const devToolReloadOutput = z.object({
  success: z.boolean(),
  timestamp: z.number(),
});

// Core DevTool contract
export const devToolCoreContract = oc.router({
  status: oc
    .route({
      method: 'GET',
      path: '/status',
      summary: 'Get DevTool status',
      description: 'Returns current status and plugin count',
    })
    .input(devToolStatusInput)
    .output(devToolStatusOutput),
    
  reload: oc
    .route({
      method: 'POST',
      path: '/reload',
      summary: 'Reload DevTool',
      description: 'Triggers a router reload in development',
    })
    .input(devToolReloadInput)
    .output(devToolReloadOutput),
});

export type DevToolCoreContract = typeof devToolCoreContract;

// Export contracts from plugins
export { routesContract } from '../core/routes/shared/contract'

// Placeholder contracts for other plugins (will be implemented)
export const bundleContract = {
  // Bundle inspector ORPC procedures will be defined here
  getChunks: {},
  getModules: {},
  analyze: {},
} as const

export const logsContract = {
  // Log viewer ORPC procedures will be defined here
  getLogs: {},
  subscribe: {},
  filter: {},
} as const

export const performanceContract = {
  // Performance monitor ORPC procedures will be defined here
  getMetrics: {},
  getTimeline: {},
  analyze: {},
} as const
