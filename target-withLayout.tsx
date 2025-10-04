/**
 * withLayout.tsx - HOC for wrapping pages with layout data
 * 
 * This HOC injects layout data into page components
 */

import type { ReactNode } from 'react'
import type { LayoutBuilder } from './makeLayout'

// ============================================================================
// TYPES
// ============================================================================

type LayoutData<TBuilder> = TBuilder extends LayoutBuilder<any, infer Data, infer InnerState>
  ? {
      data: Data
      innerState: InnerState
    }
  : never

type MultiLayoutData<TBuilders extends Record<string, LayoutBuilder<any, any, any>>> = {
  [K in keyof TBuilders]: LayoutData<TBuilders[K]>
}

type PagePropsWithLayout<TLayoutOrLayouts, TPageProps = {}> = TPageProps & {
  layoutData: TLayoutOrLayouts extends LayoutBuilder<any, any, any>
    ? LayoutData<TLayoutOrLayouts>
    : TLayoutOrLayouts extends Record<string, LayoutBuilder<any, any, any>>
    ? MultiLayoutData<TLayoutOrLayouts>
    : never
}

type PageComponent<TProps> = (props: TProps) => ReactNode

// ============================================================================
// withLayout - Single Layout
// ============================================================================

export function withLayout<
  TBuilder extends LayoutBuilder<any, any, any>,
  TPageProps = {}
>(
  layout: TBuilder
): <TComponent extends PageComponent<PagePropsWithLayout<TBuilder, TPageProps>>>(
  component: TComponent
) => PageComponent<TPageProps>

// ============================================================================
// withLayout - Multiple Layouts
// ============================================================================

export function withLayout<
  TBuilders extends Record<string, LayoutBuilder<any, any, any>>,
  TPageProps = {}
>(
  layouts: TBuilders
): <TComponent extends PageComponent<PagePropsWithLayout<TBuilders, TPageProps>>>(
  component: TComponent
) => PageComponent<TPageProps>

// ============================================================================
// withLayout - Implementation
// ============================================================================

export function withLayout(layoutOrLayouts: any) {
  return function<TComponent extends PageComponent<any>>(component: TComponent) {
    return function WrappedPage(pageProps: any) {
      // Single layout
      if ('getConfig' in layoutOrLayouts) {
        const config = layoutOrLayouts.getConfig()
        const layoutData = {
          data: config.data,
          innerState: config.innerState()
        }
        
        return component({ ...pageProps, layoutData })
      }
      
      // Multiple layouts
      const layoutData: any = {}
      for (const [key, layout] of Object.entries(layoutOrLayouts)) {
        const config = (layout as any).getConfig()
        layoutData[key] = {
          data: config.data,
          innerState: config.innerState()
        }
      }
      
      return component({ ...pageProps, layoutData })
    }
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Example 1: Single layout
import { withLayout } from '@/routes/withLayout'
import { DashboardLayout } from '@/routes'

export default withLayout(DashboardLayout)(function DashboardPage({ layoutData }) {
  return (
    <div>
      <h2>{layoutData.data.title}</h2>
      <p>Sidebar: {layoutData.innerState.sidebarOpen ? 'Open' : 'Closed'}</p>
      <button onClick={layoutData.innerState.toggleSidebar}>Toggle</button>
    </div>
  )
})

// Example 2: Multiple layouts
import { withLayout } from '@/routes/withLayout'
import { HomeLayout, DashboardLayout } from '@/routes'

export default withLayout({ 
  home: HomeLayout, 
  dashboard: DashboardLayout 
})(function ComplexPage({ layoutData }) {
  return (
    <div>
      <p>Home title: {layoutData.home.data.title}</p>
      <p>Theme: {layoutData.home.innerState.theme}</p>
      <p>Dashboard title: {layoutData.dashboard.data.title}</p>
      <p>Sidebar: {layoutData.dashboard.innerState.sidebarOpen ? 'Open' : 'Closed'}</p>
    </div>
  )
})

// Example 3: With additional page props
import { withLayout } from '@/routes/withLayout'
import { DashboardLayout } from '@/routes'

type PageProps = {
  userId: string
}

export default withLayout(DashboardLayout)<PageProps>(function UserPage({ layoutData, userId }) {
  return (
    <div>
      <h2>User: {userId}</h2>
      <p>Layout: {layoutData.data.title}</p>
    </div>
  )
})
*/
