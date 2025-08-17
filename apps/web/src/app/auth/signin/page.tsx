'use client'

import Link from 'next/link'

import { Button } from '@repo/ui/components/shadcn/button'
import { Input } from '@repo/ui/components/shadcn/input'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@repo/ui/components/shadcn/form'
import { Alert, AlertDescription } from '@repo/ui/components/shadcn/alert'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@repo/ui/components/shadcn/card'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'
import redirect from '@/actions/redirect'
import { AlertCircle, Spinner } from '@repo/ui/components/atomics/atoms/Icon'
import { loginSchema } from './schema'
import { Authsignin } from '@/routes'
import { ArrowLeft, Shield, Fingerprint } from 'lucide-react'
import { authClient } from '@/lib/auth'
import { useSearchParams } from '@/routes/hooks'

const LoginPage: React.FC = () => {
    const searchParams = useSearchParams(Authsignin)
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [isPasskeyLoading, setIsPasskeyLoading] = React.useState<boolean>(false)
    const [error, setError] = React.useState<string>('')
    const [passkeySupported, setPasskeySupported] = React.useState<boolean>(false)

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    // Check if passkey is supported and preload conditional UI
    React.useEffect(() => {
        const checkPasskeySupport = async () => {
            if (typeof window !== 'undefined' && 'PublicKeyCredential' in window) {
                setPasskeySupported(true)
                
                // Check if conditional UI is supported and preload passkeys
                if (
                    PublicKeyCredential.isConditionalMediationAvailable &&
                    (await PublicKeyCredential.isConditionalMediationAvailable())
                ) {
                    try {
                        // Preload passkeys for conditional UI
                        await authClient.signIn.passkey({ autoFill: true })
                    } catch (error) {
                        // Silently fail - this is just preloading
                        console.debug('Passkey preload failed:', error)
                    }
                }
            }
        }

        checkPasskeySupport()
    }, [])

    const onSubmit = async (
        values: z.infer<typeof loginSchema>
    ): Promise<void> => {
        setIsLoading(true)
        setError('')
        const res = await authClient.signIn.email({
            email: values.email,
            password: values.password,
        })
        if (res?.error) {
            console.log(res)
            // Handle both string and object error types
            const errorMessage = res.error.message || 'Authentication failed'
            setError(errorMessage)
            setIsLoading(false)
        } else {
            redirect(searchParams.callbackUrl ?? '/')
        }
    }

    const handlePasskeySignIn = async () => {
        if (!passkeySupported) {
            return
        }
        
        setIsPasskeyLoading(true)
        setError('')
        
        try {
            const res = await authClient.signIn.passkey({
                email: form.getValues('email') || undefined, // Use email if provided
            })
            
            if (res?.error) {
                const errorMessage = res.error.message || 'Passkey authentication failed'
                setError(errorMessage)
            } else {
                redirect(searchParams.callbackUrl ?? '/')
            }
        } catch (error) {
            console.error('Passkey sign-in error:', error)
            setError('Passkey authentication failed. Please try again.')
        } finally {
            setIsPasskeyLoading(false)
        }
    }

    return (
        <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-md space-y-8">
                <Card>
                    <CardHeader className="space-y-4 text-center">
                        <div className="flex justify-center">
                            <div className="bg-primary/10 rounded-full p-3">
                                <Shield className="text-primary h-8 w-8" />
                            </div>
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold">
                                Welcome Back
                            </CardTitle>
                            <CardDescription className="text-base">
                                Sign in to your account to access the NestJS
                                application
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel htmlFor="email">
                                                    Email Address
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="john@example.com"
                                                        id="email"
                                                        type="email"
                                                        className="h-12"
                                                        autoComplete="username webauthn"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center justify-between">
                                                    <FormLabel htmlFor="password">
                                                        Password
                                                    </FormLabel>
                                                    <Link
                                                        href="/forgot-password"
                                                        className="text-primary text-sm hover:underline"
                                                    >
                                                        Forgot password?
                                                    </Link>
                                                </div>
                                                <FormControl>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        className="h-12"
                                                        autoComplete="current-password webauthn"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {error && (
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                {error}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="space-y-3">
                                        <Button
                                            disabled={isLoading}
                                            type="submit"
                                            className="h-12 w-full text-base"
                                        >
                                            {isLoading && <Spinner />}
                                            Sign In with Email
                                        </Button>

                                        {passkeySupported && (
                                            <>
                                                <div className="relative">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <span className="w-full border-t" />
                                                    </div>
                                                    <div className="relative flex justify-center text-xs uppercase">
                                                        <span className="bg-background text-muted-foreground px-2">
                                                            Or continue with
                                                        </span>
                                                    </div>
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-12 w-full text-base"
                                                    disabled={isPasskeyLoading}
                                                    onClick={handlePasskeySignIn}
                                                >
                                                    {isPasskeyLoading && <Spinner />}
                                                    {!isPasskeyLoading && <Fingerprint className="mr-2 h-4 w-4" />}
                                                    Sign In with Passkey
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background text-muted-foreground px-2">
                                            Demo Credentials
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                                    <p className="text-foreground mb-2 font-medium">
                                        Try the demo:
                                    </p>
                                    <div className="text-muted-foreground space-y-1">
                                        <p>
                                            <strong>Email:</strong>{' '}
                                            admin@admin.com
                                        </p>
                                        <p>
                                            <strong>Password:</strong> adminadmin
                                        </p>
                                    </div>
                                    {passkeySupported && (
                                        <p className="text-muted-foreground mt-2 text-xs">
                                            💡 After signing in, you can register a passkey for future logins
                                        </p>
                                    )}
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <div className="text-muted-foreground text-center text-sm">
                    <p>
                        Don&apos;t have an account?{' '}
                        <Link
                            href={`/auth/signup${searchParams.callbackUrl ? `?callbackUrl=${encodeURIComponent(searchParams.callbackUrl)}` : ''}`}
                            className="text-primary hover:underline"
                        >
                            Sign Up
                        </Link>
                    </p>
                    <p className="mt-2">
                        <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex items-center space-x-2 text-sm">
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back to Home</span>
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
