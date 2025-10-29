'use client'

import {
    ThemeProvider as StaticNextThemesProvider,
    ThemeProviderProps,
} from 'next-themes'

const NextThemesProvider = StaticNextThemesProvider

export default function ThemeProvider({
    children,
    ...props
}: ThemeProviderProps) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
