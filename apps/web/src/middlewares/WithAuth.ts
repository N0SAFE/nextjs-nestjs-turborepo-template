/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import {
    NextFetchEvent,
    NextProxy,
    NextRequest,
    NextResponse,
} from 'next/server'
import { ConfigFactory, Matcher, MiddlewareFactory } from './utils/types'
import { nextjsRegexpPageOnly, nextNoApi } from './utils/static'
import { matcherHandler } from './utils/utils'
import { validateEnvSafe } from '#/env'
import { toAbsoluteUrl } from '@/lib/utils'
import { Authsignin } from '@/routes/index'
import { createDebug } from '@/lib/debug'
import { getCookieCache, getSessionCookie } from "better-auth/cookies";
import type { Session } from '@repo/auth'

const debugAuth = createDebug('middleware/auth')
const debugAuthError = createDebug('middleware/auth/error')

const env = validateEnvSafe(process.env).data

const showcaseRegexpAndChildren = /^\/showcase(\/.*)?$/
const dashboardRegexpAndChildren = /^\/dashboard(\/.*)?$/

const withAuth: MiddlewareFactory = (next: NextProxy) => {
    if (!env) {
        debugAuthError('Environment variables are not valid')
        throw new Error('env is not valid')
    }
    return async (request: NextRequest, _next: NextFetchEvent) => {
        debugAuth(`Checking authentication for ${request.nextUrl.pathname}`, {
            path: request.nextUrl.pathname
        })

        const masterTokenEnabled = env.NODE_ENV === 'development' ? request.cookies.get('master-token-enabled')?.value === 'true' : false

        if (masterTokenEnabled) {
            return next(request, _next)
        }

        // Get session using Better Auth directly
        let sessionCookie: string | null = null
        let sessionError: unknown = null
        const startTime = Date.now()

        try {
            debugAuth('Getting session using Better Auth')
            
            sessionCookie = getSessionCookie(request);
            
            const s = await getCookieCache<Session>(request)
            
            console.log(s)
            
            debugAuth('Session processed:', {
                hasSession: !!sessionCookie,
            })
            
        } catch (error) {
            console.error('Error getting session from Better Auth:', error)
            sessionError = error
            const duration = Date.now() - startTime
            debugAuthError('Error getting session from Better Auth:', {
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined,
                duration: `${String(duration)}ms`,
                errorType: error instanceof Error ? error.constructor.name : typeof error,
            })
        }

        const isAuth = !!sessionCookie

        console.log({
            isAuth,
            sessionError,
            sessionCookie
        })

        debugAuth(`Session result - isAuth: ${String(isAuth)}, hasError: ${String(!!sessionError)}`, {
            path: request.nextUrl.pathname,
            isAuth,
            hasError: !!sessionError
        })

        if (isAuth) {
            const matcher = matcherHandler(request.nextUrl.pathname, [
                {
                    and: [showcaseRegexpAndChildren, '/me/customer'],
                },
                () => {
                    // in this route we can check if the user is authenticated with the customer role
                    // if (session?.user?.role === 'customer') {
                    //     return next(request, _next)
                    // }
                    // return NextResponse.redirect(
                    //     process.env.NEXT_PUBLIC_APP_URL!.replace(/\/$/, '') +
                    //         '/auth/login' +
                    //         '?' +
                    //         encodeURIComponent(
                    //             'callbackUrl=' +
                    //                 request.nextUrl.pathname +
                    //                 (request.nextUrl.search ?? '')
                    //         )
                    // )
                },
            ])
            if (matcher.hit) {
                return matcher.data // return the Response associated
            }
            return next(request, _next) // call the next middleware because the route is good
        } else {
            // User is not authenticated, redirect to login for protected routes
            debugAuth(`Redirecting unauthenticated user from ${request.nextUrl.pathname} to signin`)
            console.log('redirecting from WithAuth middleware')
            return NextResponse.redirect(
                toAbsoluteUrl(
                    Authsignin(
                        {},
                        {
                            callbackUrl:
                                request.nextUrl.pathname +
                                (request.nextUrl.search ?? ''),
                        }
                    )
                )
            )
        }
    }
}

export default withAuth

export const matcher: Matcher = [
    {
        and: [
            nextNoApi,
            nextjsRegexpPageOnly,
            {
                or: [
                    showcaseRegexpAndChildren,
                    dashboardRegexpAndChildren,
                    '/settings',
                    '/profile',
                ],
            },
        ],
    },
]

export const config: ConfigFactory = {
    name: 'withAuth',
    matcher: true,
}
