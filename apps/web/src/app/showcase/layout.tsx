'use client'

import React, { useState, createContext, useContext } from 'react'
import { z } from 'zod'
import { defineLayout, makeLayout } from '@/routes/makeRoute'
import type { LayoutParams, LayoutState } from '@/routes/makeRoute'

// Define schema for showcase layout data
const showcaseLayoutDataSchema = z.object({
    title: z.string(),
    sections: z.array(z.string()),
    isInteractive: z.boolean(),
})

// Define inner state type with client-side state management
type ShowcaseLayoutInnerState = {
    activeSection: string | null
    setActiveSection: (section: string | null) => void
    viewMode: 'grid' | 'list'
    setViewMode: (mode: 'grid' | 'list') => void
    isExpanded: boolean
    setIsExpanded: (expanded: boolean) => void
}

// Create context for showcase state (optional, but useful for deeply nested components)
const ShowcaseContext = createContext<ShowcaseLayoutInnerState | null>(null)

export const useShowcaseLayout = () => {
    const context = useContext(ShowcaseContext)
    if (!context) {
        throw new Error('useShowcaseLayout must be used within ShowcaseLayout')
    }
    return context
}

// Create layout using defineLayout pattern
const ShowcaseLayoutComponent = defineLayout<
    z.infer<typeof showcaseLayoutDataSchema>,
    ShowcaseLayoutInnerState
>((_params: LayoutParams) => {
    // Client-side state management
    const [activeSection, setActiveSection] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [isExpanded, setIsExpanded] = useState(false)
    
    // Inner state
    const innerState: ShowcaseLayoutInnerState = {
        activeSection,
        setActiveSection,
        viewMode,
        setViewMode,
        isExpanded,
        setIsExpanded,
    }
    
    // Layout data
    const data = {
        title: 'Showcase',
        sections: ['Components', 'Examples', 'Demos', 'Documentation'],
        isInteractive: true,
    }
    
    // UI renderer
    const ui = (renderChildren: (innerState: ShowcaseLayoutInnerState) => React.ReactNode) => {
        return (
            <ShowcaseContext.Provider value={innerState}>
                <div className="flex h-full w-full flex-col">
                    {renderChildren(innerState)}
                </div>
            </ShowcaseContext.Provider>
        )
    }
    
    const state: LayoutState<z.infer<typeof showcaseLayoutDataSchema>, ShowcaseLayoutInnerState> = {
        ui,
        data,
        innerState,
    }
    
    return state
})

// Create layout builder
export const ShowcaseLayout = makeLayout(
    '/showcase',
    {
        name: 'showcase',
        params: z.object({}),
        search: z.object({}),
        data: showcaseLayoutDataSchema,
        description: 'Showcase layout with interactive sections',
    },
    ShowcaseLayoutComponent
)

// Export default for Next.js App Router
export default function ShowcaseLayoutWrapper({
    children,
}: {
    children: React.ReactNode
}) {
    return ShowcaseLayoutComponent({ children })
}
