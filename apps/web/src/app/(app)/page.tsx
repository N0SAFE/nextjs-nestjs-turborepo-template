import React from 'react'
import { Button } from '@repo/ui/components/shadcn/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@repo/ui/components/shadcn/card'
import {
    AuthSignin,
    Showcase,
    ShowcaseClient,
    ShowcaseServer,
    BuildInfo,
} from '@/routes'
import {
    ArrowRight,
    Database,
    Monitor,
    Server,
    Zap,
    Shield,
    Palette,
    Code,
    GitBranch,
    Layers,
    Clock,
} from 'lucide-react'
import { PageTimingLogger } from '@/lib/timing'

import type { JSX } from 'react'

// Performance timing helper
const startTimer = () => performance.now()
const elapsed = (start: number) => (performance.now() - start).toFixed(2)

function FeatureCard({
    icon: Icon,
    title,
    description,
    gradient,
}: {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
    gradient: string
}) {
    return (
        <Card className="from-background to-muted/20 relative overflow-hidden border-0 bg-linear-to-br">
            <div
                className={`absolute inset-0 bg-linear-to-br ${gradient} opacity-5`}
            />
            <CardHeader className="relative">
                <div className="flex items-center space-x-3">
                    <div
                        className={`rounded-lg bg-linear-to-br p-2 ${gradient}`}
                    >
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="relative">
                <CardDescription className="text-sm leading-relaxed">
                    {description}
                </CardDescription>
            </CardContent>
        </Card>
    )
}

export default function Page(): JSX.Element {
    const pageStart = startTimer()
    console.log(`🏡 HomePage: START`)
    console.log(`🏡 HomePage: Rendering JSX... (setup took ${elapsed(pageStart)}ms)`)
    const jsx = (
        <div className="container mx-auto mt-8 space-y-12 px-4 py-12 md:py-16 lg:py-20">
            {/* Hero Section */}
            <section className="space-y-6 text-center">
                <div className="space-y-4">
                    <h1 className="from-primary to-primary/60 bg-linear-to-r bg-clip-text text-4xl font-bold text-transparent md:text-6xl">
                        Next.js NestJS Template
                    </h1>
                    <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
                        A modern, full-stack monorepo template featuring
                        Next.js, NestJS API, Shadcn UI, and TypeScript with
                        authentication and declarative routing.
                    </p>
                </div>
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                    <Showcase.Link>
                        <Button
                            size="lg"
                            className="flex items-center space-x-2"
                        >
                            <Database className="h-5 w-5" />
                            <span>Explore Showcase</span>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Showcase.Link>
                    <AuthSignin.Link search={{ callbackUrl: '/showcase' }}>
                        <Button
                            variant="outline"
                            size="lg"
                            className="flex items-center space-x-2"
                        >
                            <Shield className="h-5 w-5" />
                            <span>Get Started</span>
                        </Button>
                    </AuthSignin.Link>
                </div>
            </section>

            {/* Features Grid */}
            <section className="space-y-8">
                <div className="space-y-2 text-center">
                    <h2 className="text-3xl font-bold">Features</h2>
                    <p className="text-muted-foreground">
                        Everything you need to build modern web applications
                    </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <FeatureCard
                        icon={Zap}
                        title="Full-Stack Setup"
                        description="Complete Next.js frontend with NestJS API backend, ready for production deployment."
                        gradient="from-yellow-400 to-orange-500"
                    />
                    <FeatureCard
                        icon={Layers}
                        title="Monorepo Structure"
                        description="Organized with Turborepo for efficient development, shared packages, and optimized builds."
                        gradient="from-blue-500 to-purple-600"
                    />
                    <FeatureCard
                        icon={Palette}
                        title="Modern UI"
                        description="Beautiful Shadcn UI components with Tailwind CSS, dark mode support, and responsive design."
                        gradient="from-pink-500 to-rose-500"
                    />
                    <FeatureCard
                        icon={Shield}
                        title="Authentication"
                        description="Integrated Better Auth with NestJS authentication, secure session management, and role-based access."
                        gradient="from-green-500 to-teal-600"
                    />
                    <FeatureCard
                        icon={GitBranch}
                        title="Declarative Routing"
                        description="Type-safe routing system with automatic route generation and link validation."
                        gradient="from-indigo-500 to-blue-600"
                    />
                    <FeatureCard
                        icon={Code}
                        title="Type Safety"
                        description="Full TypeScript support across all packages with shared configurations and strict type checking."
                        gradient="from-purple-500 to-violet-600"
                    />
                </div>
            </section>

            {/* Quick Start Section */}
            <section className="space-y-8">
                <div className="space-y-2 text-center">
                    <h2 className="text-3xl font-bold">Quick Start</h2>
                    <p className="text-muted-foreground">
                        Explore different aspects of the application
                    </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <Monitor className="h-8 w-8 text-blue-500" />
                                <div>
                                    <h3 className="text-xl font-semibold">
                                        Client-Side Examples
                                    </h3>
                                    <p className="text-muted-foreground text-sm">
                                        React Query, client-side data fetching
                                    </p>
                                </div>
                            </div>
                            <p className="text-muted-foreground">
                                Explore how to fetch data on the client side
                                using React Query, handle loading states, and
                                manage real-time updates.
                            </p>
                            <ShowcaseClient.Link>
                                <Button className="w-full">
                                    View Client Examples
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </ShowcaseClient.Link>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <Server className="h-8 w-8 text-green-500" />
                                <div>
                                    <h3 className="text-xl font-semibold">
                                        Server-Side Examples
                                    </h3>
                                    <p className="text-muted-foreground text-sm">
                                        SSR, server components, API routes
                                    </p>
                                </div>
                            </div>
                            <p className="text-muted-foreground">
                                Learn server-side rendering techniques, React
                                Server Components, and API route implementations
                                with NestJS API integration.
                            </p>
                            <ShowcaseServer.Link>
                                <Button className="w-full">
                                    View Server Examples
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </ShowcaseServer.Link>
                        </div>
                    </Card>
                    <Card className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <Clock className="h-8 w-8 text-purple-500" />
                                <div>
                                    <h3 className="text-xl font-semibold">
                                        Build Information
                                    </h3>
                                    <p className="text-muted-foreground text-sm">
                                        Static build time information
                                    </p>
                                </div>
                            </div>
                            <p className="text-muted-foreground">
                                View the exact time when the application was
                                built. This page is generated statically at
                                build time and shows deployment information.
                            </p>
                            <BuildInfo.Link>
                                <Button className="w-full">
                                    View Build Info
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </BuildInfo.Link>
                        </div>
                    </Card>
                </div>
            </section>
            
            {/* Timing Logger */}
            <PageTimingLogger pageName="Home" />
        </div>
    )
    
    console.log(`🏡 HomePage: JSX created in ${elapsed(pageStart)}ms`)
    return jsx
}
