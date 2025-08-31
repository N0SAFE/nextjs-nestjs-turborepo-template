import { NextMiddleware, NextResponse } from 'next/server'
import { Matcher, MiddlewareFactory } from './utils/types'
import { envIsValid, validateEnvSafe } from '#/env'
import { nextjsRegexpPageOnly, nextNoApi, noPublic } from './utils/static'
import { matcherHandler } from './utils/utils'
import { toAbsoluteUrl } from '@/lib/utils'
import { Middlewareerrorenv } from '@/routes'
import { createDebug } from '@/lib/debug'

const debugEnv = createDebug('middleware/env')
const debugEnvError = createDebug('middleware/env/error')

const errorPageRenderingPath = '/middleware/error/env'

const withEnv: MiddlewareFactory = (next: NextMiddleware) => {
    return async (request, _next) => {
        const isValid = envIsValid(process.env)
        debugEnv('Environment validation check', { 
            path: request.nextUrl.pathname, 
            isValid 
        })
        
        const matcher = matcherHandler(request.nextUrl.pathname, [
            [
                errorPageRenderingPath,
                () => {
                    if (isValid) {
                        const redirectUrl = request.nextUrl.searchParams.get('from') ||
                            request.nextUrl.origin + '/'
                        debugEnv('Redirecting from error page to valid URL', {
                            from: errorPageRenderingPath,
                            to: redirectUrl
                        })
                        return NextResponse.redirect(redirectUrl)
                    }
                },
            ],
            [
                { not: errorPageRenderingPath },
                () => {
                    if (isValid) {
                        debugEnv('Environment valid, proceeding to next middleware')
                        return next(request, _next)
                    }
                    if (process.env?.NODE_ENV === 'development') {
                        const errorUrl = toAbsoluteUrl(
                            Middlewareerrorenv({}, {
                                from: request.url
                            })
                        )
                        debugEnv('Environment invalid, redirecting to error page', {
                            from: request.url,
                            to: errorUrl
                        })
                        return NextResponse.redirect(errorUrl)
                    } else {
                        const errorData = validateEnvSafe(process.env).error
                        debugEnvError('Environment validation failed in production', {
                            errors: errorData
                        })
                        throw new Error(
                            'Invalid environment variables:' +
                                JSON.stringify(errorData)
                        )
                    }
                },
            ],
        ])
        if (matcher.hit) {
            debugEnv('Matcher hit, returning matched response')
            return matcher.data
        }
        return next(request, _next)
    }
}

export default withEnv

export const matcher: Matcher = [
    { and: [nextjsRegexpPageOnly, nextNoApi, noPublic] },
]
