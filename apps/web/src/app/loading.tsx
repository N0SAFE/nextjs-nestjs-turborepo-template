/**
 * Root Loading Page
 * 
 * This is the default loading state for the entire application.
 * Next.js automatically wraps page content in a Suspense boundary
 * and shows this loading UI during navigation and initial load.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
 */

import { AppLoadingScreen } from '@/components/loading'

export default function Loading() {
  return <AppLoadingScreen />
}
