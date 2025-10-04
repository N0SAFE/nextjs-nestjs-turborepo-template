/**
 * hooks.ts - Layout hooks (updated with useLayoutData)
 * 
 * This adds useLayoutData hook to the existing hooks file
 */

import { useRouter } from 'next/navigation'
import {
    useParams as useNextParams,
    useSearchParams as useNextSearchParams,
} from 'next/navigation'
import { z } from 'zod'
import type { LayoutBuilder } from './makeLayout'

// ... existing imports and hooks ...

// ============================================================================
// useLayoutData - Single Layout
// ============================================================================

export function useLayoutData<TBuilder extends LayoutBuilder<any, any, any>>(
  layout: TBuilder
): {
  data: TBuilder['data']
  innerState: TBuilder['innerState']
}

// ============================================================================
// useLayoutData - Multiple Layouts
// ============================================================================

export function useLayoutData<TBuilders extends Record<string, LayoutBuilder<any, any, any>>>(
  layouts: TBuilders
): {
  [K in keyof TBuilders]: {
    data: TBuilders[K]['data']
    innerState: TBuilders[K]['innerState']
  }
}

// ============================================================================
// useLayoutData - Implementation
// ============================================================================

export function useLayoutData(layoutOrLayouts: any): any {
  // Single layout
  if ('getConfig' in layoutOrLayouts) {
    const config = layoutOrLayouts.getConfig()
    return {
      data: config.data,
      innerState: config.innerState()
    }
  }
  
  // Multiple layouts
  const result: any = {}
  for (const [key, layout] of Object.entries(layoutOrLayouts)) {
    const config = (layout as any).getConfig()
    result[key] = {
      data: config.data,
      innerState: config.innerState()
    }
  }
  
  return result
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// Example 1: Single layout
'use client'
import { useLayoutData } from '@/routes/hooks'
import { DashboardLayout } from '@/routes'

function ClientComponent() {
  const { data, innerState } = useLayoutData(DashboardLayout)
  
  return (
    <div>
      <p>Title: {data.title}</p>
      <p>Sidebar: {innerState.sidebarOpen ? 'Open' : 'Closed'}</p>
      <button onClick={innerState.toggleSidebar}>Toggle</button>
    </div>
  )
}

// Example 2: Multiple layouts
'use client'
import { useLayoutData } from '@/routes/hooks'
import { HomeLayout, DashboardLayout } from '@/routes'

function MultiLayoutComponent() {
  const layoutData = useLayoutData({ 
    home: HomeLayout, 
    dashboard: DashboardLayout 
  })
  
  return (
    <div>
      <p>Home: {layoutData.home.data.title}</p>
      <p>Theme: {layoutData.home.innerState.theme}</p>
      
      <p>Dashboard: {layoutData.dashboard.data.title}</p>
      <p>Sidebar: {layoutData.dashboard.innerState.sidebarOpen ? 'Open' : 'Closed'}</p>
      
      <button onClick={() => layoutData.home.innerState.setTheme('dark')}>
        Dark Theme
      </button>
      <button onClick={layoutData.dashboard.innerState.toggleSidebar}>
        Toggle Sidebar
      </button>
    </div>
  )
}

// Example 3: Using with route data
'use client'
import { useLayoutData } from '@/routes/hooks'
import { useParams } from '@/routes/hooks'
import { DashboardLayout, DashboardUserRoute } from '@/routes'

function UserDashboard() {
  const { data, innerState } = useLayoutData(DashboardLayout)
  const routeParams = useParams(DashboardUserRoute)
  
  return (
    <div>
      <h2>User: {routeParams.userId}</h2>
      <p>Layout: {data.title}</p>
      <p>Sidebar: {innerState.sidebarOpen ? 'Open' : 'Closed'}</p>
    </div>
  )
}
*/
