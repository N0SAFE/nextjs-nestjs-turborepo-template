'use client'

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
import { signupSchema } from './schema'
import { Home, Authsignup, Authsignin } from '@/routes'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { authClient } from '@/lib/auth'
import { useSearchParams } from '@/routes/hooks'

const SignupPage: React.FC = () => {
    const searchParams = useSearchParams(Authsignup)
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [error, setError] = React.useState<string>('')
    const [success, setSuccess] = React.useState<string>('')

    const form = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    })

    const onSubmit = async (
        values: z.infer<typeof signupSchema>
    ): Promise<void> => {
        setIsLoading(true)
        setError('')
        setSuccess('')
        
        const res = await authClient.signUp.email({
            email: values.email,
            password: values.password,
            name: values.name,
        })
        
        if (res?.error) {
            // Handle both string and object error types
            const errorMessage = res.error.message || 'Registration failed'
            setError(errorMessage)
            setIsLoading(false)
        } else {
            setSuccess('Account created successfully! Redirecting...')
            setTimeout(() => {
                redirect(searchParams.callbackUrl ?? '/')
            }, 1500)
        }
    }

    return (
        <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-md space-y-8">
                <Card>
                    <CardHeader className="space-y-4 text-center">
                        <div className="flex justify-center">
                            <div className="bg-primary/10 rounded-full p-3">
                                <UserPlus className="text-primary h-8 w-8" />
                            </div>
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold">
                                Create Account
                            </CardTitle>
                            <CardDescription className="text-base">
                                Sign up to get started with the NestJS
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
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel htmlFor="name">
                                                    Full Name
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="John Doe"
                                                        id="name"
                                                        type="text"
                                                        className="h-12"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
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
                                                <FormLabel htmlFor="password">
                                                    Password
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        className="h-12"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel htmlFor="confirmPassword">
                                                    Confirm Password
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        id="confirmPassword"
                                                        type="password"
                                                        className="h-12"
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

                                    {success && (
                                        <Alert>
                                            <AlertDescription>
                                                {success}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <Button
                                        disabled={isLoading}
                                        type="submit"
                                        className="h-12 w-full text-base"
                                    >
                                        {isLoading && <Spinner />}
                                        Create Account
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <div className="text-muted-foreground text-center text-sm">
                    <p>
                        Already have an account?{' '}
                        <Authsignin.Link
                            search={{ callbackUrl: searchParams.callbackUrl }}
                            className="text-primary hover:underline"
                        >
                            Sign in here
                        </Authsignin.Link>
                    </p>
                    <p className="mt-2">
                        <Home.Link className="text-muted-foreground hover:text-foreground inline-flex items-center space-x-2 text-sm">
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back to Home</span>
                        </Home.Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default SignupPage
