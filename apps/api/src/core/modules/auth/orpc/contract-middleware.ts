import type { AnyContractRouter } from "@orpc/contract";
import type { Context, ImplementerInternalWithMiddlewares, Middleware } from "@orpc/server";
import { implement, type ORPCGlobalContext } from "@orpc/nest";
import { requireAuth, accessControl, publicAccess } from "./middlewares";
import type { AccessOptions, ORPCAuthContext } from "./types";

/**
 * Type for contracts that are routers (not single procedures)
 * Only routers have the .use() method at the top level
 */
type ContractRouter<TMeta = any> = {
  [key: string]: AnyContractRouter;
};

/**
 * Type for the result of implementing a contract with middleware
 */
export type ContractWithMiddleware<
  TContract extends AnyContractRouter,
  TContext extends Context = ORPCGlobalContext
> = ImplementerInternalWithMiddlewares<TContract, TContext, TContext & { auth: ORPCAuthContext }>;

/**
 * Creates an implementer for a contract router with authentication middleware pre-applied.
 * 
 * This is the recommended pattern for implementing contracts that require authentication
 * on multiple or all procedures. Instead of calling `.use(requireAuth())` on each procedure,
 * use this helper to get an implementer with auth middleware already applied.
 * 
 * **Type Safety**: The returned implementer has full type inference for:
 * - Input/output types from the contract
 * - Context type with authenticated auth context
 * - All middleware chains are properly typed
 * 
 * @example
 * ```typescript
 * // Instead of this pattern (repetitive):
 * @Implement(userContract.list)
 * list() {
 *   return implement(userContract.list).use(requireAuth()).handler(...)
 * }
 * 
 * @Implement(userContract.create)
 * create() {
 *   return implement(userContract.create).use(requireAuth()).handler(...)
 * }
 * 
 * // Use this pattern (cleaner):
 * const impl = withAuth(userContract);
 * 
 * @Implement(userContract.list)
 * list() {
 *   return impl.list.handler(({ input, context }) => {
 *     // context.auth is guaranteed to be authenticated
 *     const userId = context.auth.user!.id;
 *     ...
 *   });
 * }
 * ```
 * 
 * @param contract - The ORPC contract router to implement (must be a router, not a single procedure)
 * @returns An implementer with authentication middleware applied to all procedures
 */
export function withAuth<TContract extends ContractRouter>(
  contract: TContract
): ContractWithMiddleware<TContract> {
  // The implement() function returns a Proxy that provides the `use` method
  // We access it dynamically to preserve the Proxy behavior
  const implementer = implement(contract);
  const useMethod = (implementer as any).use;
  if (typeof useMethod !== 'function') {
    throw new Error('Contract must be a router (not a single procedure) to use withAuth');
  }
  return useMethod(requireAuth()) as ContractWithMiddleware<TContract>;
}

/**
 * Creates an implementer for a contract router with access control middleware pre-applied.
 * 
 * Use this when you need specific roles or permissions across multiple procedures.
 * 
 * @example
 * ```typescript
 * // Apply admin role requirement to all procedures
 * const impl = withAccessControl(adminContract, { roles: ['admin'] });
 * 
 * @Implement(adminContract.listUsers)
 * listUsers() {
 *   return impl.listUsers.handler(({ context }) => {
 *     // User is guaranteed to have 'admin' role
 *     ...
 *   });
 * }
 * ```
 * 
 * @param contract - The ORPC contract router to implement (must be a router, not a single procedure)
 * @param options - Access control options (roles, permissions, etc.)
 * @returns An implementer with access control middleware applied to all procedures
 */
export function withAccessControl<TContract extends ContractRouter>(
  contract: TContract,
  options: AccessOptions & { requireAuth?: boolean }
): ContractWithMiddleware<TContract> {
  const implementer = implement(contract);
  const useMethod = (implementer as any).use;
  if (typeof useMethod !== 'function') {
    throw new Error('Contract must be a router (not a single procedure) to use withAccessControl');
  }
  return useMethod(accessControl(options)) as ContractWithMiddleware<TContract>;
}

/**
 * Creates an implementer for a contract router with public access (no auth required).
 * 
 * Use this for contracts where all or most procedures should be publicly accessible.
 * The auth context is still available but not guaranteed to be authenticated.
 * 
 * @example
 * ```typescript
 * const impl = withPublicAccess(publicContract);
 * 
 * @Implement(publicContract.healthCheck)
 * healthCheck() {
 *   return impl.healthCheck.handler(({ context }) => {
 *     // context.auth.isLoggedIn may be false
 *     if (context.auth.isLoggedIn) {
 *       // Optional: customize response for authenticated users
 *     }
 *     ...
 *   });
 * }
 * ```
 * 
 * @param contract - The ORPC contract router to implement (must be a router, not a single procedure)
 * @returns An implementer with public access middleware applied
 */
export function withPublicAccess<TContract extends ContractRouter>(
  contract: TContract
): ImplementerInternalWithMiddlewares<TContract, ORPCGlobalContext, ORPCGlobalContext> {
  const implementer = implement(contract);
  const useMethod = (implementer as any).use;
  if (typeof useMethod !== 'function') {
    throw new Error('Contract must be a router (not a single procedure) to use withPublicAccess');
  }
  return useMethod(publicAccess()) as ImplementerInternalWithMiddlewares<TContract, ORPCGlobalContext, ORPCGlobalContext>;
}

/**
 * Creates an implementer for a contract router with custom middleware pre-applied.
 * 
 * This is the most flexible option for applying any ORPC middleware to a contract router.
 * 
 * @example
 * ```typescript
 * // Create custom middleware
 * const auditMiddleware = os.$context<{ auth: ORPCAuthContext }>().middleware(async (opts) => {
 *   console.log('Audit: ', opts.context.auth.user?.id);
 *   return opts.next(opts);
 * });
 * 
 * // Apply to contract
 * const impl = withMiddleware(userContract, auditMiddleware);
 * ```
 * 
 * @param contract - The ORPC contract router to implement (must be a router, not a single procedure)
 * @param middleware - The middleware to apply
 * @returns An implementer with the specified middleware applied
 */
export function withMiddleware<
  TContract extends ContractRouter,
  TOutContext extends Context
>(
  contract: TContract,
  middleware: Middleware<any, TOutContext, unknown, unknown, any, any>
): ImplementerInternalWithMiddlewares<TContract, ORPCGlobalContext, ORPCGlobalContext & TOutContext> {
  const implementer = implement(contract);
  const useMethod = (implementer as any).use;
  if (typeof useMethod !== 'function') {
    throw new Error('Contract must be a router (not a single procedure) to use withMiddleware');
  }
  return useMethod(middleware) as ImplementerInternalWithMiddlewares<TContract, ORPCGlobalContext, ORPCGlobalContext & TOutContext>;
}

/**
 * Type helper for extracting the procedure implementer from a contract with middleware.
 * 
 * @example
 * ```typescript
 * type UserListImplementer = ProcedureFromContract<typeof userContract, 'list'>;
 * ```
 */
export type ProcedureFromContract<
  TContract extends AnyContractRouter,
  TKey extends keyof TContract
> = TContract[TKey];

/**
 * Re-export implement for convenience when you need to implement without middleware
 */
export { implement } from "@orpc/nest";
