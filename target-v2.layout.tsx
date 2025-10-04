/**
 * UPDATED LAYOUT PATTERN V2
 * 
 * This shows the new architecture where:
 * 1. defineLayout returns either UI or config based on params
 * 2. makeLayout creates layout builders (similar to makeRoute)
 * 3. withLayout HOC wraps pages with layout data injection
 * 4. useLayoutData hook for accessing layout data in components
 */

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { z } from 'zod'

// ============================================================================
// TYPES
// ============================================================================

type LayoutConfig<TData, TInnerState> = {
  ui: (renderChildren: (innerState: TInnerState) => ReactNode) => ReactNode
  data: TData
  innerState: () => TInnerState
}

type LayoutParams = {
  children: ReactNode
  noUiRender?: boolean
}

// ============================================================================
// defineLayout - Returns UI or Config based on params
// ============================================================================

function defineLayout<TData, TInnerState>(
  layoutStateFn: (params: LayoutParams) => LayoutConfig<TData, TInnerState>
) {
  return function(params: LayoutParams): ReactNode | LayoutConfig<TData, TInnerState> {
    const config = layoutStateFn(params)
    
    // If noUiRender flag is set, return the config for other functions to use
    if (params.noUiRender) {
      return config
    }
    
    // Otherwise, render the UI with children
    return config.ui((innerState) => params.children)
  }
}

// ============================================================================
// EXAMPLE LAYOUTS
// ============================================================================

// Dashboard Layout
const DashboardContext = createContext<{
  sidebarOpen: boolean
  toggleSidebar: () => void
} | null>(null)

export const DashboardLayoutFn = defineLayout(function layoutState({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return {
    ui: (renderChildren) => (
      <DashboardContext.Provider value={{ 
        sidebarOpen, 
        toggleSidebar: () => setSidebarOpen(!sidebarOpen) 
      }}>
        <div className="dashboard-layout">
          <header>
            <h1>Dashboard</h1>
            <button onClick={() => setSidebarOpen(!sidebarOpen)}>Toggle</button>
          </header>
          <div className="layout-container">
            {sidebarOpen && <nav className="sidebar">Sidebar</nav>}
            <main>{renderChildren({ sidebarOpen, toggleSidebar: () => setSidebarOpen(!sidebarOpen) })}</main>
          </div>
        </div>
      </DashboardContext.Provider>
    ),

    data: {
      title: 'Dashboard',
      requiresAuth: true,
    },

    innerState: () => {
      const ctx = useContext(DashboardContext)
      if (!ctx) throw new Error('Must be within DashboardLayout')
      return ctx
    }
  }
})

// Home Layout
const HomeContext = createContext<{
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
} | null>(null)

export const HomeLayoutFn = defineLayout(function layoutState({ children }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  return {
    ui: (renderChildren) => (
      <HomeContext.Provider value={{ theme, setTheme }}>
        <div className={`home-layout theme-${theme}`}>
          <header>
            <h1>Home</h1>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              Toggle Theme
            </button>
          </header>
          <main>{renderChildren({ theme, setTheme })}</main>
          <footer>Footer</footer>
        </div>
      </HomeContext.Provider>
    ),

    data: {
      title: 'Home',
      requiresAuth: false,
    },

    innerState: () => {
      const ctx = useContext(HomeContext)
      if (!ctx) throw new Error('Must be within HomeLayout')
      return ctx
    }
  }
})

// ============================================================================
// Layout Route Info (for makeLayout)
// ============================================================================

export const DashboardLayoutRoute = {
  name: 'DashboardLayout',
  params: z.object({}),
  data: z.object({
    title: z.string(),
    requiresAuth: z.boolean(),
  }),
  innerState: z.object({
    sidebarOpen: z.boolean(),
    toggleSidebar: z.function(),
  })
}

export const HomeLayoutRoute = {
  name: 'HomeLayout',
  params: z.object({}),
  data: z.object({
    title: z.string(),
    requiresAuth: z.boolean(),
  }),
  innerState: z.object({
    theme: z.enum(['light', 'dark']),
    setTheme: z.function(),
  })
}

// ============================================================================
// USAGE EXAMPLES (these would be auto-generated in routes/index.ts)
// ============================================================================

/*
// In routes/index.ts (auto-generated):

import { makeLayout } from './makeLayout'
import { DashboardLayoutFn, DashboardLayoutRoute } from '@/app/dashboard/layout'
import { HomeLayoutFn, HomeLayoutRoute } from '@/app/layout'

export const DashboardLayout = makeLayout('/dashboard', {
  name: 'DashboardLayout',
  params: DashboardLayoutRoute.params,
  data: DashboardLayoutRoute.data,
  innerState: DashboardLayoutRoute.innerState,
  layoutFn: DashboardLayoutFn
})

export const HomeLayout = makeLayout('/', {
  name: 'HomeLayout',
  params: HomeLayoutRoute.params,
  data: HomeLayoutRoute.data,
  innerState: HomeLayoutRoute.innerState,
  layoutFn: HomeLayoutFn
})
*/

// ============================================================================
// USAGE IN PAGES
// ============================================================================

/*
// Example 1: Single layout with withLayout
import { withLayout } from '@/routes/withLayout'
import { DashboardLayout } from '@/routes'

export default withLayout(DashboardLayout)(function DashboardPage({ layoutData }) {
  // layoutData.data = { title: 'Dashboard', requiresAuth: true }
  // layoutData.innerState = { sidebarOpen: boolean, toggleSidebar: () => void }
  
  return (
    <div>
      <h2>Dashboard Page</h2>
      <p>Title: {layoutData.data.title}</p>
      <p>Sidebar: {layoutData.innerState.sidebarOpen ? 'Open' : 'Closed'}</p>
      <button onClick={layoutData.innerState.toggleSidebar}>Toggle Sidebar</button>
    </div>
  )
})

// Example 2: Multiple layouts composition
import { withLayout } from '@/routes/withLayout'
import { HomeLayout, DashboardLayout } from '@/routes'

export default withLayout({ 
  home: HomeLayout, 
  dashboard: DashboardLayout 
})(function ComplexPage({ layoutData }) {
  // layoutData.home.data = { ... }
  // layoutData.home.innerState = { theme, setTheme }
  // layoutData.dashboard.data = { ... }
  // layoutData.dashboard.innerState = { sidebarOpen, toggleSidebar }
  
  return (
    <div>
      <p>Theme: {layoutData.home.innerState.theme}</p>
      <p>Sidebar: {layoutData.dashboard.innerState.sidebarOpen ? 'Open' : 'Closed'}</p>
    </div>
  )
})

// Example 3: Using hooks in client components
'use client'
import { useLayoutData } from '@/routes/hooks'
import { DashboardLayout } from '@/routes'

function ClientComponent() {
  const layoutData = useLayoutData(DashboardLayout)
  
  return (
    <button onClick={layoutData.innerState.toggleSidebar}>
      Toggle Sidebar
    </button>
  )
}

// Example 4: Multiple layouts with hooks
'use client'
import { useLayoutData } from '@/routes/hooks'
import { HomeLayout, DashboardLayout } from '@/routes'

function MultiLayoutComponent() {
  const layoutData = useLayoutData({ home: HomeLayout, dashboard: DashboardLayout })
  
  return (
    <div>
      <button onClick={() => layoutData.home.innerState.setTheme('dark')}>
        Dark Theme
      </button>
      <button onClick={layoutData.dashboard.innerState.toggleSidebar}>
        Toggle Sidebar
      </button>
    </div>
  )
}
*/
