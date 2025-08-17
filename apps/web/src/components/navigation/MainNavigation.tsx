'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@repo/ui/components/shadcn/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@repo/ui/components/shadcn/dropdown-menu'
import {
    Home,
    Authsignin,
    Authme,
    Appshowcase,
    AppshowcaseClient,
    AppshowcaseServer,
} from '@/routes'
import { useSession } from '@/lib/auth'
import {
    User,
    Home as HomeIcon,
    Database,
    Server,
    Monitor,
    ChevronDown,
} from 'lucide-react'
import SignOutButton from '../signout/signoutButton'
import { validateEnvPath } from '#/env'

const MainNavigation: React.FC = () => {
    const pathname = usePathname()
    const docsUrl = validateEnvPath(process.env.NEXT_PUBLIC_DOC_URL, 'NEXT_PUBLIC_DOC_URL')
    const { data: session, isPending } = useSession()

    const isActive = (path: string) => pathname === path

    return (
        <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
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
                            variant={isActive('/') ? 'default' : 'ghost'}
                            size="sm"
                            className="flex items-center space-x-2"
                        >
                            <HomeIcon className="h-4 w-4" />
                            <span>Home</span>
                        </Button>
                    </Home.Link>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant={
                                    pathname.startsWith('/showcase')
                                        ? 'default'
                                        : 'ghost'
                                }
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
                                <Appshowcase.Link className="flex w-full items-center space-x-2">
                                    <Database className="h-4 w-4" />
                                    <div>
                                        <div className="font-medium">
                                            Overview
                                        </div>
                                        <div className="text-muted-foreground text-sm">
                                            All examples
                                        </div>
                                    </div>
                                </Appshowcase.Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <AppshowcaseClient.Link className="flex w-full items-center space-x-2">
                                    <Monitor className="h-4 w-4" />
                                    <div>
                                        <div className="font-medium">
                                            Client Side
                                        </div>
                                        <div className="text-muted-foreground text-sm">
                                            React Query examples
                                        </div>
                                    </div>
                                </AppshowcaseClient.Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <AppshowcaseServer.Link className="flex w-full items-center space-x-2">
                                    <Server className="h-4 w-4" />
                                    <div>
                                        <div className="font-medium">
                                            Server Side
                                        </div>
                                        <div className="text-muted-foreground text-sm">
                                            SSR examples
                                        </div>
                                    </div>
                                </AppshowcaseServer.Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {docsUrl && (
                        <a href={docsUrl} target="_blank" rel="noreferrer">
                            <Button
                                variant={isActive('/docs') ? 'default' : 'ghost'}
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
                    {isPending ? (
                        <div className="bg-muted h-8 w-8 animate-pulse rounded-md" />
                    ) : session ? (
                        <div className="flex items-center space-x-2">
                            <Authme.Link>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center space-x-2"
                                >
                                    <User className="h-4 w-4" />
                                    <span>Profile</span>
                                </Button>
                            </Authme.Link>
                            <SignOutButton />
                        </div>
                    ) : (
                        <Authsignin.Link>
                            <Button variant="default" size="sm">
                                Sign In
                            </Button>
                        </Authsignin.Link>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default MainNavigation
