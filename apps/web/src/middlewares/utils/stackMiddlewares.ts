// middlewares/stackMiddlewares
import { NextResponse } from 'next/server'
import { CustomNextMiddleware, MatcherType, Middleware } from './types'
import { matcherHandler } from './utils'

export function stackMiddlewares(
    functions: Middleware[] = [],
    config?: unknown,
    index = 0
): CustomNextMiddleware {
    const current = functions[index]
    if (current) {
        const next = stackMiddlewares(functions, config, index + 1)
        if (typeof current === 'function') {
            return current(next)
        }
        const { default: middleware, matcher } = current
        return (req, _next) => {
            if (!matcher) {
                return middleware(next)(req, _next)
            }

            if (Array.isArray(matcher)) {
                const ctx = Array(matcher.length).fill({})
                const matched = matcherHandler(
                    req.nextUrl.pathname,
                    matcher.map((m, i) => [m, () => i]) as [
                        matcher: MatcherType,
                        callback: () => number,
                    ][]
                )
                if (matched.hit) {
                    return middleware(next)(req, _next, {
                        key: matched.data,
                        ctx: ctx[matched.data],
                    })
                }
            } else if (typeof matcher === 'object') {
                const ctx = Object.keys(matcher).reduce(
                    (acc, key) => ({ ...acc, [key]: {} }),
                    {}
                ) as typeof matcher
                const matched = matcherHandler(
                    req.nextUrl.pathname,
                    Object.keys(matcher).map((m) => [matcher[m], () => m]) as [
                        matcher: MatcherType,
                        callback: () => string,
                    ][]
                )
                if (matched.hit) {
                    return middleware(next)(req, _next, {
                        key: matched.data,
                        ctx: ctx[matched.data],
                    })
                }
            }
            return next(req, _next)
        }
    }
    return () => NextResponse.next()
}
