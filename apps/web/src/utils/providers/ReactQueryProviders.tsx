'use client'

import { useState, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TanStackDevToolProvider } from '@repo/nextjs-devtool'

export default function ReactQueryProviders({
    children,
}: Readonly<{ children: ReactNode }>) {
    const [queryClient] = useState(() => new QueryClient())
    return (
        <QueryClientProvider client={queryClient}>
            <TanStackDevToolProvider>
                {children}
            </TanStackDevToolProvider>
        </QueryClientProvider>
    )
}
