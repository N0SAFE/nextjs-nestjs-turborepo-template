'use client'

import { PropsWithChildren } from 'react'
import { Authsignin } from '@/routes/index'
import { Button } from '@repo/ui/components/shadcn/button'
import { signOut, useSession, $Infer } from './index'
import { usePathname, useSearchParams } from 'next/navigation'
import { toAbsoluteUrl } from '../utils'

export function IsSignedIn({
    children,
    validator,
}: PropsWithChildren<{
    validator?: (session: typeof $Infer.Session) => boolean
}>) {
    const { data: session } = useSession()
    if (session && (validator ? validator(session) : true)) {
        return <>{children}</>
    }
    return null
}

export function IsSignedOut({
    children,
}: React.PropsWithChildren<object>) {
    const { data: session } = useSession()
    if (!session) {
        return <>{children}</>
    }
    return null
}

export function LoginLink(
    props: Omit<React.ComponentProps<typeof Authsignin.Link>, 'search'>
) {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const callbackUrl = toAbsoluteUrl(`/${pathname}?${searchParams.toString()}`)

    // Cast the entire Link component to work around type generation issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const LinkComponent = Authsignin.Link as any

    return (
        <LinkComponent {...props} search={{ callbackUrl }} />
    )
}

export function LogoutButton(props: React.ComponentProps<typeof Button>) {
    return (
        <Button
            onClick={async (e) => {
                await signOut()
                props.onClick?.(e)
            }}
            {...props}
        />
    )
}
