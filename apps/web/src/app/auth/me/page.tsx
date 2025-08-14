import { Authsignin, Home, Appshowcase } from '@/routes/index'
import { Button } from '@repo/ui/components/shadcn/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@repo/ui/components/shadcn/card'
import { headers } from 'next/headers'
import React from 'react'
import {
    ArrowLeft,
    User,
    Database,
    Mail,
    Calendar,
    Shield,
} from 'lucide-react'
import { getServerSession } from '@/lib/auth/actions'
import SignOutButton from '../../../components/signout/signoutButton'

export default async function MePage() {
    const headersList = await headers()
    const url = headersList.get('x-pathname')
    const { data: betterAuthSession } = await getServerSession(headersList)

    if (!url) {
        throw new Error('No x-pathname header found')
    }

    return (
        <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-2xl space-y-8">
                {/* Header */}
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold">Profile Dashboard</h1>
                    <p className="text-muted-foreground">
                        Manage your account settings and view your profile
                        information
                    </p>
                </div>

                <div className="grid gap-6">
                    {/* NextAuth Session Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-3">
                                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle>NextAuth Session</CardTitle>
                                    <CardDescription>
                                        Authentication session details
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {betterAuthSession ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                            Status
                                        </span>
                                        <span className="rounded-md bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900 dark:text-green-200">
                                            Authenticated
                                        </span>
                                    </div>
                                    {betterAuthSession?.user?.email && (
                                        <div className="flex items-center space-x-2">
                                            <Mail className="text-muted-foreground h-4 w-4" />
                                            <span className="text-sm">
                                                {betterAuthSession.user.email}
                                            </span>
                                        </div>
                                    )}
                                    {betterAuthSession?.user?.name && (
                                        <div className="flex items-center space-x-2">
                                            <User className="text-muted-foreground h-4 w-4" />
                                            <span className="text-sm">
                                                {betterAuthSession.user.name}
                                            </span>
                                        </div>
                                    )}
                                    {betterAuthSession?.session?.expiresAt && (
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="text-muted-foreground h-4 w-4" />
                                            <span className="text-sm">
                                                Expires:{' '}
                                                {new Date(
                                                    betterAuthSession.session
                                                        .expiresAt
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="border-t pt-2">
                                        <details className="text-xs">
                                            <summary className="text-muted-foreground cursor-pointer">
                                                View raw session data
                                            </summary>
                                            <pre className="bg-muted mt-2 overflow-auto rounded p-2 text-xs">
                                                {JSON.stringify(
                                                    betterAuthSession,
                                                    null,
                                                    2
                                                )}
                                            </pre>
                                        </details>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-4 text-center">
                                    <p className="text-muted-foreground">
                                        No active session
                                    </p>
                                    <span className="mt-2 inline-block rounded-md bg-red-100 px-2 py-1 text-xs text-red-800 dark:bg-red-900 dark:text-red-200">
                                        Not Authenticated
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Navigate to different parts of the application
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            <Appshowcase.Link>
                                <Button
                                    variant="default"
                                    className="flex items-center space-x-2"
                                >
                                    <Database className="h-4 w-4" />
                                    <span>View Showcase</span>
                                </Button>
                            </Appshowcase.Link>
                            <Authsignin.Link search={{ callbackUrl: url }}>
                                <Button
                                    variant="outline"
                                    className="flex items-center space-x-2"
                                >
                                    <Shield className="h-4 w-4" />
                                    <span>Re-authenticate</span>
                                </Button>
                            </Authsignin.Link>
                            <SignOutButton />
                        </div>
                    </CardContent>
                </Card>
                <div className="text-center">
                    <Home.Link className="text-muted-foreground hover:text-foreground inline-flex items-center space-x-2 text-sm">
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Home</span>
                    </Home.Link>
                </div>
            </div>
        </div>
    )
}
