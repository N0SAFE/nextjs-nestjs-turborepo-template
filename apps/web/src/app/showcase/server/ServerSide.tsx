import React from 'react'
import ListItemShowcase from '../ListItem'
import { orpc } from '@/lib/orpc'
import { unstable_rethrow } from 'next/dist/client/components/unstable-rethrow.server'

const ServerSideShowcase: React.FC = async function ServerSideShowcase() {
    // eslint-disable-next-line react-hooks/purity
    const startTime = Date.now()

    try {
        const result = await orpc.user.list.call({
            pagination: {
                limit: 10,
                offset: 0,
            },
            sort: {
                field: 'createdAt',
                direction: 'desc',
            },
        })

        // eslint-disable-next-line react-hooks/purity
        const endTime = Date.now()

        return (
            <>
                <div>Time taken: {endTime - startTime}ms</div>
                <ListItemShowcase users={result.users} />
            </>
        )
    } catch (error) {
        unstable_rethrow(error) // Ensure proper error handling in Next.js because orpc can throw redirect responses
        // eslint-disable-next-line react-hooks/purity
        const endTime = Date.now()

        return (
            <>
                <div>Time taken: {endTime - startTime}ms</div>
                <div className="text-red-500">
                    Error loading users:{' '}
                    {error instanceof Error ? error.message : 'Unknown error'}
                </div>
                <ListItemShowcase users={[]} />
            </>
        )
    }
}

export default ServerSideShowcase
