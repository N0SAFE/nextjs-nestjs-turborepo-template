/**
 * @repo/declarative-routing
 * 
 * Type-safe declarative routing for Next.js applications.
 * 
 * This package provides:
 * - Route builders with full TypeScript inference
 * - Server and client page wrappers with conditional exports
 * - Session handling with dependency injection
 * - Type-safe hooks for params and search params
 * 
 * @example Basic Usage
 * ```tsx
 * // 1. Configure the route factory (apps/web/src/routes/configure.ts)
 * import { createRouteFactory } from '@repo/declarative-routing'
 * import { createPage, createSessionPage } from '@repo/declarative-routing/page-wrappers'
 * import { withClientSession } from '@/lib/auth/with-client-session'
 * 
 * export const { makeRoute, makeGetRoute } = createRouteFactory({
 *   pageWrappers: { createPage, createClientPage: createPage, createSessionPage },
 *   sessionHOC: { withClientSession },
 * })
 * 
 * // 2. Define routes (apps/web/src/routes/index.ts)
 * import { makeRoute } from './configure'
 * import { z } from 'zod'
 * 
 * export const ProductDetail = makeRoute('/products/[productId]', {
 *   name: 'ProductDetail',
 *   params: z.object({ productId: z.string() }),
 *   search: z.object({ tab: z.string().optional() }),
 * })
 * 
 * // 3. Use in pages (apps/web/src/app/products/[productId]/page.tsx)
 * import { ProductDetail } from '@/routes'
 * 
 * export default ProductDetail.Page(({ params, search }) => {
 *   return <div>Product: {params.productId}, Tab: {search.tab}</div>
 * })
 * 
 * // 4. Use links
 * <ProductDetail.Link productId="123" search={{ tab: 'reviews' }}>
 *   View Product
 * </ProductDetail.Link>
 * ```
 * 
 * @packageDocumentation
 */

// ============================================================================
// Core Route Factory
// ============================================================================

export {
    createRouteFactory,
    emptySchema,
    z,
} from './make-route'

export type {
    RouteBuilder,
    GetRouteBuilder,
    PostRouteBuilder,
    PutRouteBuilder,
    DeleteRouteBuilder,
    CoreRouteElements,
    PageComponent,
    UnwrappedPageComponent,
    PageWrapperFactory,
    SessionHOCFactory,
    RouteFactoryConfig,
} from './make-route'

// ============================================================================
// Types (shared between server and client)
// ============================================================================

export type {
    // Session types
    Session,
    ServerAuthAdapter,
    ClientAuthAdapter,
    AuthAdapter,
    ClientSessionProps,
    
    // Page props types
    BasePageProps,
    NextPageProps,
    PageProps,
    UnwrappedPageProps,
    
    // Configuration types
    SchemasConfig,
    SessionOptions,
    
    // Route info types
    RouteInfo,
    GetInfo,
    PostInfo,
    PutInfo,
    
    // Utility types
    ParamProps,
    RouteBuilderParams,
    RouteBuilderSearch,
    ParsedData,
} from './types'

// ============================================================================
// Utilities (isomorphic)
// ============================================================================

export {
    safeParseSearchParams,
    safeParseSearchParamsSync,
    safeTryParseSearchParams,
} from './utils'
