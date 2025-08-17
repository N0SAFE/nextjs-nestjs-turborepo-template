import { NextResponse } from 'next/server'
import { orpc } from '@/lib/orpc'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const webHealth = {
            status: 'ok',
            timestamp: new Date().toISOString(),
        }

        const apiHealth = {
            status: 'unavailable' as string,
            timestamp: new Date().toISOString(),
            details: 'API could not be reached' as string,
        }

        try {
            // Check the NestJS API health endpoint using ORPC
            const apiRes = await orpc.health.check({})

            if (apiRes.status === 'ok') {
                return NextResponse.json({
                    web: webHealth,
                    api: apiRes,
                })
            } else {
                apiHealth.details = `API returned status: ${apiRes.status}`
                apiHealth.status = 'error'
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                apiHealth.details = `Error fetching API health: ${error.message}`
            }
            apiHealth.status = 'unavailable'
        }

        const healthStatus = {
            web: webHealth,
            api: apiHealth,
        }

        const isHealthy = webHealth.status === 'ok' && apiHealth.status === 'ok'

        return NextResponse.json(healthStatus, {
            status: isHealthy ? 200 : 503,
        })
    } catch (error: unknown) {
        return NextResponse.json(
            {
                status: 'error',
                message: 'An unexpected error occurred during health check.',
                error: (error as Error).message,
            },
            { status: 500 }
        )
    }
}
