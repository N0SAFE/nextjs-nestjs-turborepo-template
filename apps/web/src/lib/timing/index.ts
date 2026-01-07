/**
 * Page Performance Timing Utilities
 * 
 * Exports for measuring and logging page load performance.
 * 
 * Usage:
 * 
 * Server-side (in page.tsx):
 * ```tsx
 * import { createPageTimer, serverTiming } from '@/lib/timing'
 * 
 * export default async function Page() {
 *   const timer = createPageTimer('HomePage')
 *   
 *   const data = await serverTiming('fetchData', () => fetchData())
 *   timer.mark('data fetched')
 *   
 *   // ... render
 *   timer.end()
 *   return <div>...</div>
 * }
 * ```
 * 
 * Client-side (in components):
 * ```tsx
 * import { PageTimingLogger } from '@/lib/timing'
 * 
 * export default function Page() {
 *   return (
 *     <div>
 *       {/* content *\/}
 *       <PageTimingLogger pageName="HomePage" />
 *     </div>
 *   )
 * }
 * ```
 * 
 * Root layout (for navigation timing):
 * ```tsx
 * import { NavigationTimingProvider } from '@/lib/timing'
 * 
 * export default function RootLayout({ children }) {
 *   return <NavigationTimingProvider>{children}</NavigationTimingProvider>
 * }
 * ```
 */

// Server-side timing utilities
export {
  serverTiming,
  createPageTimer,
  withServerTiming,
  type TimingProps,
} from './server'

// Client-side timing components
export {
  PageTimingLogger,
  NavigationTimingProvider,
  useRenderTiming,
  useNavigationTiming,
  getTimingHistory,
  clearTimingHistory,
} from './client'
