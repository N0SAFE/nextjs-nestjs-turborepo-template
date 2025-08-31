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
import { createDebug } from '@/lib/debug'

const debugHealthCheck = createDebug('middleware/healthcheck')
const debugHealthCheckError = createDebug('middleware/healthcheck/error')

const NODE_ENV = validateEnvPath(process.env.NODE_ENV, 'NODE_ENV')
const errorPageRenderingPath = '/middleware/error/healthCheck'

const withHealthCheck: MiddlewareFactory = (next: NextMiddleware) => {
    return async (request: NextRequest, _next: NextFetchEvent) => {
        debugHealthCheck('Health check middleware initiated', {
            path: request.nextUrl.pathname,
            environment: NODE_ENV
        })
        
        if (NODE_ENV === 'development') {
            try {
                debugHealthCheck('Checking API health via ORPC in development mode')
                try {
                    const data = await orpcServer.health.check({})
                    debugHealthCheck('Health check response received', { data })
                    
                    if (!(data.status === 'ok')) {
                        if (request.nextUrl.pathname === errorPageRenderingPath) {
                            debugHealthCheck('Already on error page, proceeding')
                            return NextResponse.next()
                        } else {
                            const errorUrl = toAbsoluteUrl(
                                MiddlewareerrorhealthCheck({}, {
                                    json: JSON.stringify(data),
                                    from: request.url
                                })
                            )
                            debugHealthCheckError('API health check failed, redirecting to error page', {
                                from: request.url,
                                to: errorUrl,
                                healthData: data
                            })
                            return NextResponse.redirect(errorUrl)
                        }
                    }
                } catch (e: unknown) {
                    const errorData = {
                        status: 'error',
                        message: (e as Error).message || 'Unknown error',
                        timestamp: new Date().toISOString(),
                    }
                    debugHealthCheckError('Health check error caught', {
                        error: e,
                        errorData
                    })
                    
                    if (request.nextUrl.pathname === errorPageRenderingPath) {
                        debugHealthCheck('Already on error page, proceeding')
                        return NextResponse.next()
                    } else {
                        const errorUrl = toAbsoluteUrl(
                            MiddlewareerrorhealthCheck({}, {
                                json: JSON.stringify(errorData),
                                from: request.url
                            })
                        )
                        debugHealthCheckError('Redirecting to error page due to health check exception', {
                            from: request.url,
                            to: errorUrl
                        })
                        return NextResponse.redirect(errorUrl)
                    }
                }
            } catch {
                debugHealthCheckError('Unexpected error in health check middleware')
                if (request.nextUrl.pathname === errorPageRenderingPath) {
                    debugHealthCheck('Already on error page, proceeding')
                    return NextResponse.next()
                } else {
                    const errorUrl = toAbsoluteUrl(
                        MiddlewareerrorhealthCheck({}, {
                            from: request.url
                        })
                    )
                    debugHealthCheckError('Redirecting to error page due to unexpected error', {
                        from: request.url,
                        to: errorUrl
                    })
                    return NextResponse.redirect(errorUrl)
                }
            }
        }
        
        if (request.nextUrl.pathname === errorPageRenderingPath) {
            const redirectUrl = request.nextUrl.searchParams.get('from') ||
                request.nextUrl.origin + '/'
            debugHealthCheck('Redirecting from health check error page to origin', {
                from: errorPageRenderingPath,
                to: redirectUrl
            })
            return NextResponse.redirect(redirectUrl)
        }
        
        debugHealthCheck('Health check passed, proceeding to next middleware')
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
