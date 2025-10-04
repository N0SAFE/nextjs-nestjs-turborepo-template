# Real Layout Usage Examples

## ✅ Layouts Implemented

### 1. Root Layout (`/apps/web/src/app/layout.tsx`)
**Features**:
- Theme provider integration
- Authentication provider
- React Query provider
- Navigation component
- Environment-based configuration
- Layout data accessible throughout the app

**Data Available**:
```typescript
{
    appName: string
    version: string
    env: {
        isDevelopment: boolean
        reactScan: boolean
        reactScanToken?: string
        commitHash?: string
        branch?: string
    }
    metadata: {
        title: string
        description: string
    }
}
```

**Inner State Available**:
```typescript
{
    isLoading: boolean
    error: string | null
}
```

---

### 2. Showcase Layout (`/apps/web/src/app/showcase/layout.tsx`)
**Features**:
- Client-side state management
- Context provider for nested components
- Interactive section management
- View mode switching
- Expansion state

**Data Available**:
```typescript
{
    title: string
    sections: string[]
    isInteractive: boolean
}
```

**Inner State Available**:
```typescript
{
    activeSection: string | null
    setActiveSection: (section: string | null) => void
    viewMode: 'grid' | 'list'
    setViewMode: (mode: 'grid' | 'list') => void
    isExpanded: boolean
    setIsExpanded: (expanded: boolean) => void
}
```

---

## 🚀 How to Use in Your Pages

### Method 1: Using withLayout HOC

#### Example: Home Page with Root Layout
```typescript
// apps/web/src/app/page.tsx
import { withLayout } from '@/routes/makeRoute'
import { RootLayout } from './layout'

const HomePage = withLayout(RootLayout)(function HomePage({ layoutData }) {
    // Access layout data with full typing
    const { appName, version, env } = layoutData.data
    const { isLoading, error } = layoutData.innerState
    
    return (
        <div>
            <h1>{appName} v{version}</h1>
            <p>Environment: {env.isDevelopment ? 'Development' : 'Production'}</p>
            {isLoading && <p>Loading...</p>}
            {error && <p>Error: {error}</p>}
        </div>
    )
})

export default HomePage
```

#### Example: Showcase Page with Showcase Layout
```typescript
// apps/web/src/app/showcase/page.tsx
'use client'

import { withLayout } from '@/routes/makeRoute'
import { ShowcaseLayout } from './layout'

const ShowcasePage = withLayout(ShowcaseLayout)(function ShowcasePage({ layoutData }) {
    const { title, sections } = layoutData.data
    const { activeSection, setActiveSection, viewMode, setViewMode } = layoutData.innerState
    
    return (
        <div>
            <h1>{title}</h1>
            
            <div className="controls">
                <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                    Toggle View: {viewMode}
                </button>
            </div>
            
            <div className={`sections-${viewMode}`}>
                {sections.map((section) => (
                    <div 
                        key={section}
                        className={activeSection === section ? 'active' : ''}
                        onClick={() => setActiveSection(section)}
                    >
                        {section}
                    </div>
                ))}
            </div>
        </div>
    )
})

export default ShowcasePage
```

---

### Method 2: Using useLayoutData Hook in Client Components

```typescript
'use client'

import { useLayoutData } from '@/routes/hooks'
import { RootLayout } from '@/app/layout'

export function AppInfo() {
    const { data, innerState } = useLayoutData(RootLayout)
    
    return (
        <div>
            <h2>{data.appName}</h2>
            <p>Version: {data.version}</p>
            <p>Environment: {data.env.isDevelopment ? 'Dev' : 'Prod'}</p>
            {innerState.error && <div className="error">{innerState.error}</div>}
        </div>
    )
}
```

---

### Method 3: Using Context Hooks (for nested components)

```typescript
'use client'

import { useShowcaseLayout } from '@/app/showcase/layout'

export function ShowcaseControls() {
    // Access layout state from context
    const { viewMode, setViewMode, activeSection, setActiveSection } = useShowcaseLayout()
    
    return (
        <div>
            <button onClick={() => setViewMode('grid')}>Grid View</button>
            <button onClick={() => setViewMode('list')}>List View</button>
            <p>Current view: {viewMode}</p>
            {activeSection && <p>Active: {activeSection}</p>}
        </div>
    )
}
```

---

### Method 4: Combining Multiple Layouts

```typescript
'use client'

import { withLayout } from '@/routes/makeRoute'
import { RootLayout } from '@/app/layout'
import { ShowcaseLayout } from '@/app/showcase/layout'

const ComplexPage = withLayout({
    root: RootLayout,
    showcase: ShowcaseLayout
})(function ComplexPage({ layoutData }) {
    // Access both layouts with full typing
    const { appName } = layoutData.root.data
    const { activeSection, setActiveSection } = layoutData.showcase.innerState
    
    return (
        <div>
            <h1>{appName} - Showcase</h1>
            <p>Active section: {activeSection || 'None'}</p>
            <button onClick={() => setActiveSection('Components')}>
                Show Components
            </button>
        </div>
    )
})

export default ComplexPage
```

---

## 🎯 Direct Access Methods

### Server-Side Access
```typescript
// In server components
import { RootLayout } from '@/app/layout'

export default async function ServerPage() {
    // Access layout data directly
    const rootData = RootLayout.getData()
    
    return (
        <div>
            <h1>{rootData.appName}</h1>
            <p>Version: {rootData.version}</p>
        </div>
    )
}
```

### Validation
```typescript
// Validate layout data at runtime
try {
    const validatedData = RootLayout.validateData({
        appName: 'My App',
        version: '1.0.0',
        env: {
            isDevelopment: true,
            reactScan: false,
        },
        metadata: {
            title: 'My App',
            description: 'Description',
        },
    })
    
    console.log('Valid data:', validatedData)
} catch (error) {
    console.error('Invalid data:', error)
}
```

---

## 🔧 Advanced Usage

### Custom Hook for Showcase
```typescript
'use client'

import { useShowcaseLayout } from '@/app/showcase/layout'
import { useCallback } from 'react'

export function useShowcaseNavigation() {
    const { activeSection, setActiveSection, viewMode } = useShowcaseLayout()
    
    const navigateToSection = useCallback((section: string) => {
        setActiveSection(section)
        // Additional logic like scrolling, analytics, etc.
    }, [setActiveSection])
    
    const isActive = useCallback((section: string) => {
        return activeSection === section
    }, [activeSection])
    
    return {
        activeSection,
        navigateToSection,
        isActive,
        viewMode,
    }
}
```

### Typed Context Consumer
```typescript
'use client'

import { useLayoutContext } from '@/routes/makeRoute'
import { RootLayout } from '@/app/layout'

export function EnvironmentBadge() {
    const { data } = useLayoutContext<
        typeof RootLayout extends { data: infer D } ? D : never,
        typeof RootLayout extends { innerState: infer S } ? S : never
    >()
    
    return (
        <div className={data.env.isDevelopment ? 'badge-dev' : 'badge-prod'}>
            {data.env.isDevelopment ? 'DEV' : 'PROD'}
        </div>
    )
}
```

---

## 📦 Exported from Layouts

### From Root Layout
```typescript
export const RootLayout // LayoutBuilder - use with withLayout/useLayoutData
export default RootLayoutWrapper // Default export for Next.js
```

### From Showcase Layout
```typescript
export const ShowcaseLayout // LayoutBuilder
export const useShowcaseLayout // Custom hook for context access
export default ShowcaseLayoutWrapper // Default export for Next.js
```

---

## ✨ Benefits

1. **Full Type Safety** ✅
   - All layout data and state is typed
   - IDE autocomplete works everywhere
   - Compile-time error checking

2. **Context Support** ✅
   - State available in deeply nested components
   - No prop drilling required
   - Multiple contexts supported

3. **Flexible Access** ✅
   - HOC for pages: `withLayout()`
   - Hook for client components: `useLayoutData()`
   - Context for nested components: `useLayoutContext()`
   - Direct access for servers: `Layout.getData()`

4. **State Management** ✅
   - Any state approach supported (useState, useReducer, etc.)
   - State automatically available via innerState
   - Context providers automatically set up

5. **Validation** ✅
   - Runtime validation with Zod
   - Type-safe parsed results
   - Descriptive error messages

---

## 🎉 Status

✅ **Root Layout** - Fully implemented with theme, auth, providers
✅ **Showcase Layout** - Fully implemented with client-side state
✅ **Type Safety** - Complete TypeScript inference
✅ **Context Support** - Automatic context setup
✅ **Multiple Access Methods** - HOC, hooks, context, direct access
✅ **Validation** - Runtime validation with Zod

**Ready to use in your application!**
