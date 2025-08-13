/**
 * ORPC Configuration for NextJS DevTool
 * 
 * Provides centralized configuration for the ORPC system including
 * contract definitions and type safety utilities.
 */

import { oc } from '@orpc/contract';

/**
 * Base ORPC configuration with common settings
 */
export const baseContext = {
  // Base context available to all procedures
  // Can be extended by individual plugins
};

/**
 * Base router factory for DevTool contracts
 */
export const createDevToolRouter = () => {
  return oc.router({});
};

/**
 * Utility to merge multiple plugin routers
 */
export function mergePluginRouters<T extends Record<string, any>>(
  routers: T
) {
  return oc.router(routers);
}

/**
 * Type utility to extract procedure definitions from a contract
 */
export type ExtractProcedures<T> = T extends { procedures: infer P } ? P : never;

/**
 * Type utility to create a typed ORPC client
 */
export type TypedORPCClient<T> = {
  [K in keyof ExtractProcedures<T>]: ExtractProcedures<T>[K] extends {
    input: infer I;
    output: infer O;
  }
    ? (input: I) => Promise<O>
    : never;
};
