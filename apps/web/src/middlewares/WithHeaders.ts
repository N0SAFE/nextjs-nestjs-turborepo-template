import { NextFetchEvent, NextMiddleware, NextRequest } from 'next/server'
import { Matcher, MiddlewareFactory } from './utils/types'
import { nextjsRegexpPageOnly } from './utils/static'
import { createDebug } from '@/lib/debug'

const debugHeaders = createDebug('middleware/headers')

export const withHeaders: MiddlewareFactory = (next: NextMiddleware) => {
    return async (request: NextRequest, _next: NextFetchEvent) => {
        debugHeaders('Processing request headers', {
            path: request.nextUrl.pathname,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries())
        })
        
        const res = await next(request, _next)
        
        if (res) {
            res.headers.set('x-pathname', request.nextUrl.pathname)
            debugHeaders('Setting response headers', {
                path: request.nextUrl.pathname,
                'x-pathname': request.nextUrl.pathname,
                responseHeaders: Object.fromEntries(res.headers.entries())
            })
        } else {
            debugHeaders('No response returned from next middleware', {
                path: request.nextUrl.pathname
            })
        }
        
        return res
    }
}

export const matcher: Matcher = [{ and: [nextjsRegexpPageOnly] }]
