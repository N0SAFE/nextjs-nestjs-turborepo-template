/**
 * @repo/declarative-routing/hooks
 * 
 * Client-side routing hooks for declarative routing.
 * Use these hooks in client components to interact with routes.
 * 
 * @example
 * ```tsx
 * 'use client'
 * import { usePush, useParams, useSearchParams } from '@repo/declarative-routing/hooks'
 * import { ProductDetail } from '@/routes'
 * 
 * function MyComponent() {
 *   const params = useParams(ProductDetail)
 *   const search = useSearchParams(ProductDetail)
 *   const push = usePush(ProductDetail)
 *   
 *   return (
 *     <div>
 *       <p>Product: {params.productId}</p>
 *       <button onClick={() => push({ params: { productId: '456' } })}>
 *         Go to Product 456
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */

export {
    usePush,
    useParams,
    useSearchParams,
    useSearchParamState,
    emptySchema,
} from '../hooks'

export type { RouteBuilder } from '../hooks'
export { z } from '../hooks'
