'use client'

import React, { Suspense } from 'react'
import ListItemShowcase from '../ListItem'
import { Loader2 } from 'lucide-react'
import { orpc } from '@/lib/orpc'
import { useQuery } from '@tanstack/react-query'

const ClientSideShowcase: React.FC = function ClientSideShowcase() {
    const [timeTaken, setTimeTaken] = React.useState<number | null>(null)
    const startTime = React.useMemo(() => Date.now(), [])

    const { data: result, isFetched } = useQuery(
        orpc.user.list.queryOptions({
            input: {
                pagination: {
                    limit: 10,
                    offset: 0,
                },
                sort: {
                    field: 'createdAt',
                    direction: 'desc',
                },
            },
        })
    )

    React.useEffect(() => {
        if (isFetched && !timeTaken) {
            const endTime = Date.now()
            setTimeTaken(endTime - startTime)
        }
    }, [isFetched, timeTaken, startTime])

    return (
        <Suspense
            fallback={
                <div className="flex h-full w-full items-center justify-center">
                    <Loader2 className="animate-spin" />
                </div>
            }
        >
            <div className="mb-4 flex items-center justify-between">
                <p>first load</p>
                <div>Time taken: {timeTaken}ms</div>
            </div>

            {!isFetched && (
                <div className="flex h-full w-full items-center justify-center">
                    {' '}
                    <Loader2 className="animate-spin" />{' '}
                </div>
            )}
            <ListItemShowcase users={result?.users || []} />
        </Suspense>
    )
}

export default ClientSideShowcase
