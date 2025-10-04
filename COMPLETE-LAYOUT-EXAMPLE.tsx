/**
 * COMPLETE LAYOUT SYSTEM EXAMPLE
 * 
 * This file demonstrates all features of the layout system:
 * 1. defineLayout - creating layouts with conditional return
 * 2. makeLayout - creating layout builders with validation
 * 3. withLayout HOC - injecting layout data into pages (single & multiple)
 * 4. useLayoutData hook - accessing layout data in client components
 * 5. useLayoutContext - accessing layout data via React Context
 * 6. LayoutWrapper - providing context to children
 * 7. Full TypeScript type inference throughout
 */

'use client'

import { createContext, useContext, useState } from 'react'
import { z } from 'zod'
import { 
    defineLayout, 
    makeLayout, 
    withLayout, 
    useLayoutContext,
    useMultiLayoutContext,
    type LayoutParams,
    type LayoutState,
} from '@/routes/makeRoute'
import { useLayoutData } from '@/routes/hooks'

// ============================================================================
// 1. DEFINE LAYOUT SCHEMAS
// ============================================================================

const dashboardDataSchema = z.object({
    user: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        role: z.enum(['admin', 'user']),
    }),
    theme: z.enum(['light', 'dark']),
    notifications: z.number(),
})

const appDataSchema = z.object({
    appName: z.string(),
    version: z.string(),
    features: z.array(z.string()),
})

// ============================================================================
// 2. CREATE INNER STATE TYPES
// ============================================================================

type DashboardInnerState = {
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
    activeTab: string
    setActiveTab: (tab: string) => void
}

type AppInnerState = {
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
    error: string | null
    setError: (error: string | null) => void
}

// ============================================================================
// 3. CREATE CONTEXTS FOR INNER STATE
// ============================================================================

const DashboardContext = createContext<DashboardInnerState | null>(null)
const AppContext = createContext<AppInnerState | null>(null)

// ============================================================================
// 4. DEFINE LAYOUTS USING defineLayout
// ============================================================================

const DashboardLayoutComponent = defineLayout<
    z.infer<typeof dashboardDataSchema>,
    DashboardInnerState
>((params: LayoutParams) => {
    // Inner state
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [activeTab, setActiveTab] = useState('home')
    
    const innerState: DashboardInnerState = {
        sidebarOpen,
        setSidebarOpen,
        activeTab,
        setActiveTab,
    }
    
    // Data (could come from API, database, etc.)
    const data = {
        user: {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'admin' as const,
        },
        theme: 'dark' as const,
        notifications: 5,
    }
    
    // UI renderer
    const ui = (renderChildren: (innerState: DashboardInnerState) => React.ReactNode) => {
        return (
            <DashboardContext.Provider value={innerState}>
                <div className="dashboard-layout">
                    <aside className={`sidebar ${innerState.sidebarOpen ? 'open' : 'closed'}`}>
                        <h2>{data.user.name}</h2>
                        <button onClick={() => innerState.setSidebarOpen(!innerState.sidebarOpen)}>
                            Toggle Sidebar
                        </button>
                        <nav>
                            <button 
                                onClick={() => innerState.setActiveTab('home')}
                                className={innerState.activeTab === 'home' ? 'active' : ''}
                            >
                                Home
                            </button>
                            <button 
                                onClick={() => innerState.setActiveTab('settings')}
                                className={innerState.activeTab === 'settings' ? 'active' : ''}
                            >
                                Settings
                            </button>
                        </nav>
                        <div className="notifications">
                            Notifications: {data.notifications}
                        </div>
                    </aside>
                    <main className="dashboard-content">
                        {renderChildren(innerState)}
                    </main>
                </div>
            </DashboardContext.Provider>
        )
    }
    
    const state: LayoutState<z.infer<typeof dashboardDataSchema>, DashboardInnerState> = {
        ui,
        data,
        innerState,
    }
    
    return state
})

const AppLayoutComponent = defineLayout<
    z.infer<typeof appDataSchema>,
    AppInnerState
>((params: LayoutParams) => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    const innerState: AppInnerState = {
        isLoading,
        setIsLoading,
        error,
        setError,
    }
    
    const data = {
        appName: 'My Awesome App',
        version: '1.0.0',
        features: ['auth', 'dashboard', 'analytics'],
    }
    
    const ui = (renderChildren: (innerState: AppInnerState) => React.ReactNode) => {
        return (
            <AppContext.Provider value={innerState}>
                <div className="app-layout">
                    <header className="app-header">
                        <h1>{data.appName} v{data.version}</h1>
                        {innerState.isLoading && <div className="loader">Loading...</div>}
                        {innerState.error && <div className="error">{innerState.error}</div>}
                    </header>
                    <div className="app-body">
                        {renderChildren(innerState)}
                    </div>
                    <footer className="app-footer">
                        Features: {data.features.join(', ')}
                    </footer>
                </div>
            </AppContext.Provider>
        )
    }
    
    return { ui, data, innerState }
})

// ============================================================================
// 5. CREATE LAYOUT BUILDERS USING makeLayout
// ============================================================================

const DashboardLayout = makeLayout(
    '/dashboard',
    {
        name: 'dashboard',
        params: z.object({}),
        search: z.object({}),
        data: dashboardDataSchema,
        description: 'Dashboard layout with sidebar and user info',
    },
    DashboardLayoutComponent
)

const AppLayout = makeLayout(
    '/',
    {
        name: 'app',
        params: z.object({}),
        search: z.object({}),
        data: appDataSchema,
        description: 'Main app layout with header and footer',
    },
    AppLayoutComponent
)

// ============================================================================
// 6. EXAMPLE PAGES USING withLayout HOC
// ============================================================================

// Example 1: Single Layout
const DashboardPageWithSingleLayout = withLayout(DashboardLayout)(function DashboardPage({ 
    layoutData 
}) {
    // layoutData is fully typed!
    // layoutData.data: { user, theme, notifications }
    // layoutData.innerState: { sidebarOpen, setSidebarOpen, activeTab, setActiveTab }
    
    return (
        <div>
            <h1>Dashboard Page</h1>
            <p>Welcome, {layoutData.data.user.name}!</p>
            <p>Current theme: {layoutData.data.theme}</p>
            <p>Active tab: {layoutData.innerState.activeTab}</p>
            
            <button onClick={() => layoutData.innerState.setActiveTab('profile')}>
                Go to Profile
            </button>
        </div>
    )
})

// Example 2: Multiple Layouts
const ComplexPageWithMultipleLayouts = withLayout({
    dashboard: DashboardLayout,
    app: AppLayout,
})(function ComplexPage({ layoutData }) {
    // layoutData is fully typed!
    // layoutData.dashboard.data: { user, theme, notifications }
    // layoutData.dashboard.innerState: { sidebarOpen, setSidebarOpen, activeTab, setActiveTab }
    // layoutData.app.data: { appName, version, features }
    // layoutData.app.innerState: { isLoading, setIsLoading, error, setError }
    
    return (
        <div>
            <h1>Complex Page with Multiple Layouts</h1>
            
            <section>
                <h2>Dashboard Info</h2>
                <p>User: {layoutData.dashboard.data.user.name}</p>
                <p>Role: {layoutData.dashboard.data.user.role}</p>
                <p>Sidebar: {layoutData.dashboard.innerState.sidebarOpen ? 'Open' : 'Closed'}</p>
            </section>
            
            <section>
                <h2>App Info</h2>
                <p>App: {layoutData.app.data.appName}</p>
                <p>Version: {layoutData.app.data.version}</p>
                <p>Loading: {layoutData.app.innerState.isLoading ? 'Yes' : 'No'}</p>
                
                <button onClick={() => layoutData.app.innerState.setIsLoading(true)}>
                    Start Loading
                </button>
            </section>
        </div>
    )
})

// ============================================================================
// 7. EXAMPLE: USING useLayoutData HOOK
// ============================================================================

function ClientComponentWithSingleLayout() {
    // Access layout data directly in client component
    const layoutData = useLayoutData(DashboardLayout)
    
    // Fully typed!
    return (
        <div>
            <h2>Client Component</h2>
            <p>User: {layoutData.data.user.name}</p>
            <p>Email: {layoutData.data.user.email}</p>
            <button onClick={() => layoutData.innerState.setSidebarOpen(false)}>
                Close Sidebar
            </button>
        </div>
    )
}

function ClientComponentWithMultipleLayouts() {
    // Access multiple layouts
    const layouts = useLayoutData({
        dashboard: DashboardLayout,
        app: AppLayout,
    })
    
    return (
        <div>
            <h2>Multi-Layout Client Component</h2>
            <p>Dashboard User: {layouts.dashboard.data.user.name}</p>
            <p>App Name: {layouts.app.data.appName}</p>
        </div>
    )
}

// ============================================================================
// 8. EXAMPLE: USING useLayoutContext HOOK (Context-based access)
// ============================================================================

function NestedComponentUsingContext() {
    // Access layout context directly (when inside a LayoutWrapper or withLayout)
    const dashboardContext = useLayoutContext<
        z.infer<typeof dashboardDataSchema>,
        DashboardInnerState
    >()
    
    return (
        <div>
            <h3>Nested Component Using Context</h3>
            <p>Active Tab: {dashboardContext.innerState.activeTab}</p>
            <p>Notifications: {dashboardContext.data.notifications}</p>
            
            <button onClick={() => dashboardContext.innerState.setActiveTab('messages')}>
                Switch to Messages
            </button>
        </div>
    )
}

function NestedComponentWithMultiContext() {
    // Access multiple layout contexts
    const multiContext = useMultiLayoutContext()
    
    return (
        <div>
            <h3>Multi-Context Component</h3>
            <p>Dashboard User: {multiContext.dashboard.data.user.name}</p>
            <p>App Version: {multiContext.app.data.version}</p>
        </div>
    )
}

// ============================================================================
// 9. EXAMPLE: USING LayoutWrapper FOR MANUAL CONTEXT SETUP
// ============================================================================

function PageWithManualContextSetup() {
    return (
        <DashboardLayout.LayoutWrapper>
            <div>
                <h1>Page with Manual Context Setup</h1>
                <NestedComponentUsingContext />
                <ClientComponentWithSingleLayout />
            </div>
        </DashboardLayout.LayoutWrapper>
    )
}

// ============================================================================
// 10. EXAMPLE: SERVER COMPONENT WITH LAYOUT
// ============================================================================

async function ServerComponentPage() {
    // In server components, you can access layout data directly
    const dashboardData = DashboardLayout.getData()
    const dashboardInnerState = DashboardLayout.getInnerState()
    
    return (
        <div>
            <h1>Server Component Page</h1>
            <p>User from server: {dashboardData.user.name}</p>
            <p>Theme: {dashboardData.theme}</p>
            {/* Note: innerState is client-side only, but accessible for SSR */}
        </div>
    )
}

// ============================================================================
// 11. TYPE SAFETY DEMONSTRATION
// ============================================================================

function TypeSafetyDemo() {
    const layoutData = useLayoutData(DashboardLayout)
    
    // ✅ All of these are fully typed and autocompleted:
    const userName: string = layoutData.data.user.name
    const userRole: 'admin' | 'user' = layoutData.data.user.role
    const theme: 'light' | 'dark' = layoutData.data.theme
    const notifications: number = layoutData.data.notifications
    
    const sidebarOpen: boolean = layoutData.innerState.sidebarOpen
    const setSidebarOpen: (open: boolean) => void = layoutData.innerState.setSidebarOpen
    const activeTab: string = layoutData.innerState.activeTab
    const setActiveTab: (tab: string) => void = layoutData.innerState.setActiveTab
    
    // ❌ TypeScript will catch these errors:
    // const invalid = layoutData.data.nonExistent // Error: Property doesn't exist
    // layoutData.innerState.setSidebarOpen('invalid') // Error: Argument must be boolean
    
    return (
        <div>
            <h2>Type Safety Works!</h2>
            <p>{userName} - {userRole}</p>
        </div>
    )
}

// ============================================================================
// 12. VALIDATION HELPERS
// ============================================================================

function ValidationExample() {
    // Validate layout data at runtime
    try {
        const validatedData = DashboardLayout.validateData({
            user: {
                id: '1',
                name: 'John',
                email: 'john@example.com',
                role: 'admin',
            },
            theme: 'dark',
            notifications: 5,
        })
        
        console.log('Valid data:', validatedData)
    } catch (error) {
        console.error('Invalid data:', error)
    }
    
    return null
}

// ============================================================================
// EXPORT EVERYTHING
// ============================================================================

export {
    DashboardLayout,
    AppLayout,
    DashboardPageWithSingleLayout,
    ComplexPageWithMultipleLayouts,
    ClientComponentWithSingleLayout,
    ClientComponentWithMultipleLayouts,
    NestedComponentUsingContext,
    NestedComponentWithMultiContext,
    PageWithManualContextSetup,
    ServerComponentPage,
    TypeSafetyDemo,
    ValidationExample,
}

/**
 * SUMMARY OF FEATURES:
 * 
 * ✅ defineLayout - Conditional return (UI or config based on noUiRender)
 * ✅ makeLayout - Creates layout builders with all methods
 * ✅ withLayout HOC - Single and multiple layout support
 * ✅ useLayoutData hook - Access layout data in client components
 * ✅ useLayoutContext - Context-based access for deeply nested components
 * ✅ useMultiLayoutContext - Context access for multiple layouts
 * ✅ LayoutWrapper - Manual context setup
 * ✅ Full TypeScript inference - All data and innerState fully typed
 * ✅ Validation helpers - Runtime validation with Zod
 * ✅ Server component support - Access layout data server-side
 * ✅ Inner state management - useState, contexts, custom state
 * ✅ Data/UI separation - Clean separation of concerns
 * 
 * ALL FEATURES WORKING WITH FULL TYPE SAFETY! 🎉
 */
