import {
    NextFetchEvent,
    NextMiddleware,
    NextRequest,
    NextResponse,
} from 'next/server'
import { Matcher, MiddlewareFactory } from './utils/types'
import { validateEnvPath } from '#/env'
import {
    nextjsRegexpPageOnly,
    nextNoApi,
} from './utils/static'
import { orpcServer } from '@/lib/orpc'
import { toAbsoluteUrl } from '@/lib/utils'
import { MiddlewareerrorhealthCheck } from '@/routes'

const NODE_ENV = validateEnvPath(process.env.NODE_ENV, 'NODE_ENV')
const errorPageRenderingPath = '/middleware/error/healthCheck'

const withHealthCheck: MiddlewareFactory = (next: NextMiddleware) => {
    return async (request: NextRequest, _next: NextFetchEvent) => {
        console.log(
            `Health Check Middleware: Checking server health for ${request.nextUrl.pathname}`,
            request.nextUrl.pathname
        )
        if (NODE_ENV === 'development') {
            try {
                console.log('Checking API health via ORPC...')
                try {
                    const data = await orpcServer.health.check({})
                    console.log('Health Check Response:', data)
                    if (!(data.status === 'ok')) {
                        if (
                            request.nextUrl.pathname === errorPageRenderingPath
                        ) {
                            return NextResponse.next()
                        } else {
                            return NextResponse.redirect(
                                toAbsoluteUrl(
                                    MiddlewareerrorhealthCheck({}, {
                                        json: JSON.stringify(data),
                                        from: request.url
                                    })
                                )
                            )
                        }
                    }
                } catch (e: unknown) {
                    console.log('Health Check Error:', e)
                    const errorData = {
                        status: 'error',
                        message: (e as Error).message || 'Unknown error',
                        timestamp: new Date().toISOString(),
                    }
                    if (request.nextUrl.pathname === errorPageRenderingPath) {
                        return NextResponse.next()
                    } else {
                        return NextResponse.redirect(
                            toAbsoluteUrl(
                                MiddlewareerrorhealthCheck({}, {
                                    json: JSON.stringify(errorData),
                                    from: request.url
                                })
                            )
                        )
                    }
                }
            } catch {
                if (request.nextUrl.pathname === errorPageRenderingPath) {
                    return NextResponse.next()
                } else {
                    return NextResponse.redirect(
                        toAbsoluteUrl(
                            MiddlewareerrorhealthCheck({}, {
                                from: request.url
                            })
                        )
                    )
                }
            }
        }
        if (request.nextUrl.pathname === errorPageRenderingPath) {
            return NextResponse.redirect(
                request.nextUrl.searchParams.get('from') ||
                    request.nextUrl.origin + '/'
            )
        }
        return await next(request, _next)
    }
}

export default withHealthCheck

export const matcher: Matcher = [
    {
        and: [
            nextjsRegexpPageOnly,
            nextNoApi,
        ],
    },
]
