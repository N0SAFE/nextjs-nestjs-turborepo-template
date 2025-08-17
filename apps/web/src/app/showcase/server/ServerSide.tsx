import { orpcServer } from '@/lib/orpc'
import React from 'react'
import ListItemShowcase from '../ListItem'

const ServerSideShowcase: React.FC = async function ServerSideShowcase() {
    const startTime = Date.now()

    try {
        const result = await orpcServer.user.list({
            pagination: {
                limit: 10,
                offset: 0,
            },
            sort: {
                field: 'createdAt',
                direction: 'desc',
            },
        })

        const endTime = Date.now()

        return (
            <>
                <div>Time taken: {endTime - startTime}ms</div>
                <ListItemShowcase users={result.users} />
            </>
        )
    } catch (error) {
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
