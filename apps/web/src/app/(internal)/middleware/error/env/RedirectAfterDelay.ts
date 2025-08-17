'use client'

import redirect from '@/actions/redirect'
import { useEffect } from 'react'

export default function RedirectAfterDelay({
    delay,
    to,
}: {
    delay: number
    to: string
}) {
    useEffect(() => {
        const timeout = setTimeout(() => {
            redirect(to)
        }, delay)
        return () => clearTimeout(timeout)
    }, [delay, to])
    return null
}
