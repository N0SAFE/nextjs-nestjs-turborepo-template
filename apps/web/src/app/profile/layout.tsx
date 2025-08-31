'use client'

import React from 'react'

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
            <div className="flex h-full w-full flex-col">{children}</div>
    )
}
