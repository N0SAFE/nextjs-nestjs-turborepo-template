import { NextMiddleware, NextResponse } from 'next/server'
import { Matcher, MiddlewareFactory } from './utils/types'
import { envIsValid, validateEnvSafe } from '#/env'
import { nextjsRegexpPageOnly, nextNoApi, noPublic } from './utils/static'
import { matcherHandler } from './utils/utils'
import { toAbsoluteUrl } from '@/lib/utils'
import { Middlewareerrorenv } from '@/routes'

const errorPageRenderingPath = '/middleware/error/env'

const withEnv: MiddlewareFactory = (next: NextMiddleware) => {
    return async (request, _next) => {
        const isValid = envIsValid(process.env)
        const matcher = matcherHandler(request.nextUrl.pathname, [
            [
                errorPageRenderingPath,
                () => {
                    if (isValid) {
                        return NextResponse.redirect(
                            request.nextUrl.searchParams.get('from') ||
                                request.nextUrl.origin + '/'
                        )
                    }
                },
            ],
            [
                { not: errorPageRenderingPath },
                () => {
                    if (isValid) {
                        return next(request, _next)
                    }
                    if (process.env?.NODE_ENV === 'development') {
                        return NextResponse.redirect(
                            toAbsoluteUrl(
                                Middlewareerrorenv({}, {
                                    from: request.url
                                })
                            )
                        )
                    } else {
                        throw new Error(
                            'Invalid environment variables:' +
                                JSON.stringify(
                                    validateEnvSafe(process.env).error
                                )
                        )
                    }
                },
            ],
        ])
        if (matcher.hit) {
            return matcher.data
        }
        return next(request, _next)
    }
}

export default withEnv

export const matcher: Matcher = [
    { and: [nextjsRegexpPageOnly, nextNoApi, noPublic] },
]
