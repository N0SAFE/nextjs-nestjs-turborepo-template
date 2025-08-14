import React from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@repo/ui/components/shadcn/card'
import { Button } from '@repo/ui/components/shadcn/button'
import { Appshowcase, AppshowcaseServer } from '@/routes'
import { ArrowLeft, Monitor, Zap, RefreshCw, Database } from 'lucide-react'
import ClientSideShowcase from './ClientSide'

const ShowcaseClientPage: React.FC = async function ShowcaseClientPage() {
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
                    <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                        <Monitor className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>
                <div>
                    <h1 className="text-4xl font-bold">
                        Client-Side Data Fetching
                    </h1>
                    <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
                        Interactive data fetching with React Query, loading
                        states, and real-time updates
                    </p>
                </div>
            </div>

            {/* Features */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="text-center">
                    <CardContent className="pt-6">
                        <Zap className="mx-auto mb-3 h-8 w-8 text-yellow-500" />
                        <h3 className="mb-2 font-semibold">React Query</h3>
                        <p className="text-muted-foreground text-sm">
                            Powerful data synchronization with caching and
                            background updates
                        </p>
                    </CardContent>
                </Card>
                <Card className="text-center">
                    <CardContent className="pt-6">
                        <RefreshCw className="mx-auto mb-3 h-8 w-8 text-green-500" />
                        <h3 className="mb-2 font-semibold">Loading States</h3>
                        <p className="text-muted-foreground text-sm">
                            Smooth user experience with loading indicators and
                            error handling
                        </p>
                    </CardContent>
                </Card>
                <Card className="text-center">
                    <CardContent className="pt-6">
                        <Database className="mx-auto mb-3 h-8 w-8 text-blue-500" />
                        <h3 className="mb-2 font-semibold">Real-time Data</h3>
                        <p className="text-muted-foreground text-sm">
                            Live updates and optimistic UI patterns for better
                            interactivity
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
                                <Monitor className="h-5 w-5" />
                                <span>Live Demo</span>
                            </CardTitle>
                            <CardDescription>
                                Watch the data load dynamically with performance
                                metrics
                            </CardDescription>
                        </div>
                        <AppshowcaseServer.Link>
                            <Button variant="outline">Compare with SSR</Button>
                        </AppshowcaseServer.Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <ClientSideShowcase />
                </CardContent>
            </Card>

            {/* Technical Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Implementation Details</CardTitle>
                    <CardDescription>
                        How client-side data fetching works in this application
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                            <h3 className="font-semibold">Key Technologies</h3>
                            <ul className="text-muted-foreground space-y-1 text-sm">
                                <li>• React Query for data fetching</li>
                                <li>• ORPC client with type safety</li>
                                <li>• TypeScript for end-to-end types</li>
                                <li>• Suspense for loading states</li>
                                <li>• Error boundaries for error handling</li>
                            </ul>
                        </div>
                        <div className="space-y-3">
                            <h3 className="font-semibold">Benefits</h3>
                            <ul className="text-muted-foreground space-y-1 text-sm">
                                <li>• Faster subsequent navigation</li>
                                <li>• Real-time data updates</li>
                                <li>• Optimistic UI updates</li>
                                <li>• Background refetching</li>
                                <li>• Intelligent caching strategies</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t pt-4">
                        <h3 className="mb-2 font-semibold">Code Example</h3>
                        <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-xs">
                            {`const { data: result, isFetched } = orpcReact.user.list.useQuery({
    query: {
        limit: 10,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc',
    }
})`}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default ShowcaseClientPage
