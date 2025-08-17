import {
    NextFetchEvent,
    NextMiddleware,
    NextRequest,
    NextResponse,
} from 'next/server'
import { ConfigFactory, Matcher, MiddlewareFactory } from './utils/types'
import { nextjsRegexpPageOnly, nextNoApi } from './utils/static'
import { $Infer } from '@/lib/auth'
import { matcherHandler } from './utils/utils'
import { validateEnvSafe } from '#/env'
import { toAbsoluteUrl } from '@/lib/utils'
import { betterFetch } from '@better-fetch/fetch'
import { Authsignin } from '@/routes/index'

const env = validateEnvSafe(process.env).data

const showcaseRegexpAndChildren = /^\/showcase(\/.*)?$/

const withAuth: MiddlewareFactory = (next: NextMiddleware) => {
    if (!env) {
        throw new Error('env is not valid')
    }
    return async (request: NextRequest, _next: NextFetchEvent) => {
        console.log(
            `Auth Middleware: Checking authentication for ${request.nextUrl.pathname}`,
            request.nextUrl.pathname
        )

        // Get session using Better Auth
        const { data: session } = await betterFetch<typeof $Infer.Session>(
            '/api/auth/get-session',
            {
                baseURL: request.nextUrl.origin,
                headers: {
                    cookie: request.headers.get('cookie') || '', // Forward the cookies from the request
                },
            }
        )

        const isAuth = !!session

        console.log(
            `Auth Middleware: isAuth: ${isAuth}`,
            request.nextUrl.pathname
        )

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
            // this else is hit when the user is not authenticated and on the routes listed on the export matcher
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
            ) // not authenticated, redirect to login
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
                    '/dashboard',
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
