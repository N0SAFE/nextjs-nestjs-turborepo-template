/* eslint @typescript-eslint/no-explicit-any: 0 */
// middleware/types.ts

import { NextMiddleware } from 'next/server'

type AddParameters<
    TFunction extends (...args: any) => any,
    TParameters extends [...args: any],
> = (
    ...args: [...Parameters<TFunction>, ...TParameters]
) => ReturnType<TFunction>

export type CustomNextMiddleware = AddParameters<
    NextMiddleware,
    [meta?: { key: number | string; ctx: any }]
>
export type MiddlewareFactory = (
    middleware: CustomNextMiddleware
) => CustomNextMiddleware
export type Middleware<Context = unknown> =
    | MiddlewareFactory
    | {
          default: MiddlewareFactory
          matcher?: Matcher<Context>
          config?: ConfigFactory
      }
export type MatcherCondition<Context = unknown> = {
    and?: MatcherTypeArray<Context>
    or?: MatcherTypeArray<Context>
    not?: MatcherTypeArray<Context> | MatcherType<Context>
}
export type MatcherCallback<Context = unknown> = (
    string: string,
    ctx: Context
) => MatcherType<Context>
export type MatcherType<Context = unknown> =
    | string
    | RegExp
    | MatcherCondition<Context>
    | MatcherCallback<Context>
    | boolean
export type MatcherTypeArray<Context = unknown> = MatcherType<Context>[]
export type MatcherTypeRecord<Context = unknown> = Record<
    string,
    MatcherType<Context>
>
export type ConfiguredMatcher<Context = unknown> = (
    matcher: MatcherTypeArray<Context> | MatcherCallback<Context>
) => Exclude<Matcher<Context>, ConfiguredMatcher<Context>>
export type Matcher<Context = unknown> =
    | MatcherTypeArray<Context>
    | MatcherTypeRecord<Context>
    | MatcherCallback<Context>
    | boolean
    | ConfiguredMatcher<Context>

export type ConfigFactory = {
    name: string
    matcher?: true
}
