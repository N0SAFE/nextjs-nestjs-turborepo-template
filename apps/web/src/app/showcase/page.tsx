import React from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@repo/ui/components/shadcn/card'
import { Button } from '@repo/ui/components/shadcn/button'
import { Separator } from '@repo/ui/components/shadcn/separator'
import { AppshowcaseClient, AppshowcaseServer, Home } from '@/routes'
import {
    ArrowLeft,
    Monitor,
    Server,
    Clock,
    Zap,
    ArrowRight,
    Database,
} from 'lucide-react'
import ServerSideShowcase from './server/ServerSide'
import ClientSideShowcase from './client/ClientSide'

const ShowcasePage: React.FC = async function ShowcasePage() {
    return (
        <div className="container mx-auto space-y-8 px-4 py-8">
            {/* Back Navigation */}
            <Home.Link className="text-muted-foreground hover:text-foreground inline-flex items-center space-x-2 text-sm">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
            </Home.Link>

            {/* Header */}
            <div className="space-y-4 text-center">
                <div className="flex justify-center">
                    <div className="bg-primary/10 rounded-full p-3">
                        <Database className="text-primary h-8 w-8" />
                    </div>
                </div>
                <div>
                    <h1 className="text-4xl font-bold">
                        Data Fetching Showcase
                    </h1>
                    <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
                        Compare server-side and client-side data fetching
                        approaches with real API data
                    </p>
                </div>
            </div>

            {/* Quick Navigation */}
            <div className="grid gap-4 md:grid-cols-2">
                <AppshowcaseServer.Link>
                    <Card className="hover:border-primary/20 cursor-pointer border-2 border-transparent transition-shadow hover:shadow-md">
                        <CardHeader>
                            <div className="flex items-center space-x-3">
                                <Server className="h-6 w-6 text-green-600" />
                                <CardTitle>Server-Side Rendering</CardTitle>
                            </div>
                            <CardDescription>
                                Fast initial load with pre-rendered data
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-sm">
                                    View isolated example
                                </span>
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        </CardContent>
                    </Card>
                </AppshowcaseServer.Link>

                <AppshowcaseClient.Link>
                    <Card className="hover:border-primary/20 cursor-pointer border-2 border-transparent transition-shadow hover:shadow-md">
                        <CardHeader>
                            <div className="flex items-center space-x-3">
                                <Monitor className="h-6 w-6 text-blue-600" />
                                <CardTitle>Client-Side Fetching</CardTitle>
                            </div>
                            <CardDescription>
                                Interactive updates with React Query
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-sm">
                                    View isolated example
                                </span>
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        </CardContent>
                    </Card>
                </AppshowcaseClient.Link>
            </div>

            {/* Comparison Section */}
            <div className="grid gap-8 lg:grid-cols-2">
                {/* Server Side */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900">
                                    <Server className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">
                                        Server-Side
                                    </CardTitle>
                                    <CardDescription>
                                        Rendered on the server
                                    </CardDescription>
                                </div>
                            </div>
                            <AppshowcaseServer.Link>
                                <Button variant="outline" size="sm">
                                    View Isolated
                                </Button>
                            </AppshowcaseServer.Link>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-muted-foreground flex items-center space-x-2 text-sm">
                            <Zap className="h-4 w-4" />
                            <span>Fast initial render</span>
                        </div>
                        <div className="text-muted-foreground flex items-center space-x-2 text-sm">
                            <Clock className="h-4 w-4" />
                            <span>No loading states needed</span>
                        </div>
                        <Separator />
                        <ServerSideShowcase />
                    </CardContent>
                </Card>

                {/* Client Side */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                                    <Monitor className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">
                                        Client-Side
                                    </CardTitle>
                                    <CardDescription>
                                        Fetched in the browser
                                    </CardDescription>
                                </div>
                            </div>
                            <AppshowcaseClient.Link>
                                <Button variant="outline" size="sm">
                                    View Isolated
                                </Button>
                            </AppshowcaseClient.Link>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-muted-foreground flex items-center space-x-2 text-sm">
                            <Zap className="h-4 w-4" />
                            <span>Interactive updates</span>
                        </div>
                        <div className="text-muted-foreground flex items-center space-x-2 text-sm">
                            <Clock className="h-4 w-4" />
                            <span>Real-time capabilities</span>
                        </div>
                        <Separator />
                        <ClientSideShowcase />
                    </CardContent>
                </Card>
            </div>

            {/* Technical Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Technical Implementation</CardTitle>
                    <CardDescription>
                        Understanding the differences between server and
                        client-side data fetching
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                        <h3 className="flex items-center space-x-2 font-semibold">
                            <Server className="h-4 w-4" />
                            <span>Server-Side Rendering (SSR)</span>
                        </h3>
                        <ul className="text-muted-foreground space-y-1 text-sm">
                            <li>• Data fetched during page generation</li>
                            <li>• Immediate content display</li>
                            <li>• Better SEO and performance</li>
                            <li>• Uses React Server Components</li>
                            <li>• Direct ORPC API calls</li>
                        </ul>
                    </div>
                    <div className="space-y-3">
                        <h3 className="flex items-center space-x-2 font-semibold">
                            <Monitor className="h-4 w-4" />
                            <span>Client-Side Rendering (CSR)</span>
                        </h3>
                        <ul className="text-muted-foreground space-y-1 text-sm">
                            <li>• Data fetched after page load</li>
                            <li>• Loading states and error handling</li>
                            <li>• Real-time updates and caching</li>
                            <li>• Uses React Query for state management</li>
                            <li>• ORPC client with type safety</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default ShowcasePage
