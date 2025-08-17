import React from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@repo/ui/components/shadcn/card'
import { Button } from '@repo/ui/components/shadcn/button'
import { Appshowcase, AppshowcaseClient } from '@/routes'
import { ArrowLeft, Server, Zap, Shield, Globe } from 'lucide-react'
import ServerSideShowcase from './ServerSide'

const ShowcaseServerPage: React.FC = async function ShowcaseServerPage() {
    return (
        <div className="container mx-auto space-y-8 px-4 py-8">
            {/* Back Navigation */}
            <Appshowcase.Link className="text-muted-foreground hover:text-foreground inline-flex items-center space-x-2 text-sm">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Showcase</span>
            </Appshowcase.Link>

            {/* Header */}
            <div className="space-y-4 text-center">
                <div className="flex justify-center">
                    <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                        <Server className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                </div>
                <div>
                    <h1 className="text-4xl font-bold">
                        Server-Side Rendering
                    </h1>
                    <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
                        Fast, SEO-friendly pages with pre-rendered data using
                        React Server Components
                    </p>
                </div>
            </div>

            {/* Features */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="text-center">
                    <CardContent className="pt-6">
                        <Zap className="mx-auto mb-3 h-8 w-8 text-yellow-500" />
                        <h3 className="mb-2 font-semibold">Lightning Fast</h3>
                        <p className="text-muted-foreground text-sm">
                            Immediate content display with no loading states
                            required
                        </p>
                    </CardContent>
                </Card>
                <Card className="text-center">
                    <CardContent className="pt-6">
                        <Globe className="mx-auto mb-3 h-8 w-8 text-blue-500" />
                        <h3 className="mb-2 font-semibold">SEO Optimized</h3>
                        <p className="text-muted-foreground text-sm">
                            Fully indexed content for better search engine
                            visibility
                        </p>
                    </CardContent>
                </Card>
                <Card className="text-center">
                    <CardContent className="pt-6">
                        <Shield className="mx-auto mb-3 h-8 w-8 text-green-500" />
                        <h3 className="mb-2 font-semibold">Secure</h3>
                        <p className="text-muted-foreground text-sm">
                            Server-side data access with better security
                            controls
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Demo */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center space-x-2">
                                <Server className="h-5 w-5" />
                                <span>Pre-rendered Content</span>
                            </CardTitle>
                            <CardDescription>
                                Data fetched during build time or page
                                generation
                            </CardDescription>
                        </div>
                        <AppshowcaseClient.Link>
                            <Button variant="outline">Compare with CSR</Button>
                        </AppshowcaseClient.Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <ServerSideShowcase />
                </CardContent>
            </Card>

            {/* Technical Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Implementation Details</CardTitle>
                    <CardDescription>
                        How server-side rendering works in this Next.js
                        application
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                            <h3 className="font-semibold">Key Technologies</h3>
                            <ul className="text-muted-foreground space-y-1 text-sm">
                                <li>• React Server Components</li>
                                <li>• Next.js App Router</li>
                                <li>• ORPC server-side calls</li>
                                <li>• TypeScript for type safety</li>
                                <li>• Streaming and Suspense</li>
                            </ul>
                        </div>
                        <div className="space-y-3">
                            <h3 className="font-semibold">Benefits</h3>
                            <ul className="text-muted-foreground space-y-1 text-sm">
                                <li>• Faster initial page load</li>
                                <li>• Better SEO performance</li>
                                <li>• Reduced client-side JavaScript</li>
                                <li>• Improved Core Web Vitals</li>
                                <li>• Server-side security</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t pt-4">
                        <h3 className="mb-2 font-semibold">Code Example</h3>
                        <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-xs">
                            {`// React Server Component
export default async function ServerComponent() {
    const result = await orpc.user.list({
        query: { limit: 10, offset: 0 }
    })
    
    return <div>{/* Render users */}</div>
}`}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default ShowcaseServerPage
