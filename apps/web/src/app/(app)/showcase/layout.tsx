'use client'

import React from 'react'

export default function ShowcaseLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <div className="flex h-full w-full flex-col">{children}</div>
}
