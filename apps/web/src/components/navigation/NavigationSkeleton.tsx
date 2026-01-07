'use client'

import React from 'react'
import { Button } from '@repo/ui/components/shadcn/button'
import {
    Home,
    Showcase,
    ShowcaseClient,
    ShowcaseServer,
} from '@/routes'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@repo/ui/components/shadcn/dropdown-menu'
import {
    Home as HomeIcon,
    Database,
    Server,
    Monitor,
    ChevronDown,
} from 'lucide-react'
import { validateEnvPath } from '#/env'

/**
 * NavigationSkeleton - A static navigation component for use as Suspense fallback
 *
 * This component renders the same visual structure as MainNavigation but without
 * any hooks that require React context (useSession, usePathname). It's designed
 * to be safely rendered during Next.js static prerendering where hooks might not
 * work correctly.
 *
 * Key differences from MainNavigation:
 * - No useSession() - shows loading state for auth area
 * - No usePathname() - no active state highlighting
 * - No conditional Dashboard link (requires session)
 * 
 * Note: This skeleton shows on all routes during initial load. The actual
 * MainNavigation will hide itself on dashboard routes once hydrated.
 */
const NavigationSkeleton: React.FC = () => {
    const docsUrl = validateEnvPath(process.env.NEXT_PUBLIC_DOC_URL, 'NEXT_PUBLIC_DOC_URL')

    return (
        <nav className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
            <div className="container flex h-14 items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Home.Link className="flex items-center space-x-2">
                        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md">
                            <HomeIcon className="h-4 w-4" />
                        </div>
                        <span className="font-bold">NestJS App</span>
                    </Home.Link>
                </div>

                <div className="flex items-center space-x-4">
                    <Home.Link>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center space-x-2"
                        >
                            <HomeIcon className="h-4 w-4" />
                            <span>Home</span>
                        </Button>
                    </Home.Link>

                    {/* Dashboard link hidden in skeleton (requires session) */}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center space-x-2"
                            >
                                <Database className="h-4 w-4" />
                                <span>Showcase</span>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Data Examples</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Showcase.Link className="flex w-full items-center space-x-2">
                                    <Database className="h-4 w-4" />
                                    <div>
                                        <div className="font-medium">
                                            Overview
                                        </div>
                                        <div className="text-muted-foreground text-sm">
                                            All examples
                                        </div>
                                    </div>
                                </Showcase.Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <ShowcaseClient.Link className="flex w-full items-center space-x-2">
                                    <Monitor className="h-4 w-4" />
                                    <div>
                                        <div className="font-medium">
                                            Client Side
                                        </div>
                                        <div className="text-muted-foreground text-sm">
                                            React Query examples
                                        </div>
                                    </div>
                                </ShowcaseClient.Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <ShowcaseServer.Link className="flex w-full items-center space-x-2">
                                    <Server className="h-4 w-4" />
                                    <div>
                                        <div className="font-medium">
                                            Server Side
                                        </div>
                                        <div className="text-muted-foreground text-sm">
                                            SSR examples
                                        </div>
                                    </div>
                                </ShowcaseServer.Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {docsUrl && (
                        <a href={docsUrl} target="_blank" rel="noreferrer">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center space-x-2"
                            >
                                <Server className="h-4 w-4" />
                                <span>Docs</span>
                            </Button>
                        </a>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    {/* Loading skeleton for auth state */}
                    <div className="bg-muted h-8 w-8 animate-pulse rounded-md" />
                </div>
            </div>
        </nav>
    )
}

export default NavigationSkeleton
