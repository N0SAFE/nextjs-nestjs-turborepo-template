import { NextFetchEvent, NextMiddleware, NextRequest } from 'next/server'
import { Matcher, MiddlewareFactory } from './utils/types'
import { nextjsRegexpPageOnly } from './utils/static'

export const withHeaders: MiddlewareFactory = (next: NextMiddleware) => {
    return async (request: NextRequest, _next: NextFetchEvent) => {
        const res = await next(request, _next)
        if (res) {
            res.headers.set('x-pathname', request.nextUrl.pathname)
        }
        return res
    }
}

export const matcher: Matcher = [{ and: [nextjsRegexpPageOnly] }]
