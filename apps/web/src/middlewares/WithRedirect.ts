import { NextFetchEvent, NextMiddleware, NextRequest } from 'next/server'
import { Matcher, MiddlewareFactory } from './utils/types'
import { nextauthNoApi, nextjsRegexpPageOnly } from './utils/static'
import { matcherHandler } from './utils/utils'

const withRedirect: MiddlewareFactory = (next: NextMiddleware) => {
    return async (request: NextRequest, _next: NextFetchEvent) => {
        const matcher = matcherHandler(request.nextUrl.pathname, [
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
            return matcher.data
        }
        return next(request, _next)
    }
}

export default withRedirect

export const matcher: Matcher = [
    {
        and: [nextjsRegexpPageOnly, nextauthNoApi],
    },
]
