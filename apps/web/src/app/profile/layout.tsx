'use client'

import Validate from '@/lib/auth/validate'
import React from 'react'

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <Validate>
            <div className="flex h-full w-full flex-col">{children}</div>
        </Validate>
    )
}
