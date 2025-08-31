import { NextFetchEvent, NextMiddleware, NextRequest, NextResponse } from 'next/server'
import { Matcher, MiddlewareFactory } from './utils/types'
import { nextNoApi, nextjsRegexpPageOnly } from './utils/static'
import { matcherHandler } from './utils/utils'
import { createDebug } from '@/lib/debug'

const debugRedirect = createDebug('middleware/redirect')

const withRedirect: MiddlewareFactory = (next: NextMiddleware) => {
    return async (request: NextRequest, _next: NextFetchEvent) => {
        debugRedirect('Processing redirect rules', {
            path: request.nextUrl.pathname,
            origin: request.nextUrl.origin
        })
        
        const matcher = matcherHandler(request.nextUrl.pathname, [
            [
                { or: ['/'] },
                () => {
                    const redirectUrl = new URL('/dashboard', request.url)
                    debugRedirect('Redirecting root path to dashboard', {
                        from: '/',
                        to: redirectUrl.href
                    })
                    return NextResponse.redirect(redirectUrl)
                },
            ],
            // [
            //     { or: ['/profile'] },
            //     () => {
            //         return NextResponse.redirect('/profile/me')
            //     },
            // ],
            // [
            //     { or: ['/auth/login'] },
            //     () => {
            //         if (comeFromForbiddenRoute(request)) {
            //             return NextResponse.redirect(
            //                 '/auth/login?from=forbidden'
            //             )
            //         }
            //         return NextResponse.redirect('/auth/login')
            //     },
            // ],
        ])
        
        if (matcher.hit) {
            debugRedirect('Redirect rule matched, returning redirect response')
            return matcher.data
        }
        
        debugRedirect('No redirect rules matched, proceeding to next middleware')
        return next(request, _next)
    }
}

export default withRedirect

export const matcher: Matcher = [
    {
        and: [nextjsRegexpPageOnly, nextNoApi],
    },
]
