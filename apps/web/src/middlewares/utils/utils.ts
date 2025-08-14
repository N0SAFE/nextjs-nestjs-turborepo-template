import { MatcherCondition, MatcherType } from './types'

type Hitted<T extends object> = ({ hit: true } & T) | { hit: false }
type Ret<
    M extends MatcherType,
    T extends
        | [matcher: M, callback: Callback]
        | [matcher: M, callback: Callback][],
    Callback extends () => unknown,
    Options extends T extends [matcher: M, callback: Callback][]
        ? {
              multiple: boolean
          }
        : {
              multiple: never
          },
> = Exclude<
    T extends [matcher: MatcherType, callback: Callback][]
        ? Options['multiple'] extends true
            ? Hitted<{
                  data: ReturnType<Callback>[]
                  number: number
              }>
            : Hitted<{
                  data: ReturnType<Callback>
              }>
        : Hitted<{
              data: ReturnType<Callback>
          }>,
    void
>

export function matcherHandler<
    M extends MatcherType,
    T extends
        | [matcher: M, callback: Callback]
        | [matcher: M, callback: Callback][],
    Options extends T extends [matcher: M, callback: Callback][]
        ? {
              multiple: boolean
          }
        : {
              multiple: never
          },
    Callback extends () => T extends [matcher: M, callback: Callback]
        ? ReturnType<T[1]>
        : T extends [matcher: M, callback: Callback][]
          ? ReturnType<T[number][1]>
          : never,
>(
    toMatch: string,
    switcher: T,
    options?: Options
): Ret<M, T, Callback, Options> {
    const match = (m: MatcherType): boolean => {
        const condition = (m: MatcherCondition) => {
            const { and, or, not } = m
            const andBool = and?.every((m) => match(m)) ?? true
            const orBool = or?.some((m) => match(m)) ?? true
            const notBool = Array.isArray(not)
                ? not.some((m) => !match(m))
                : not
                  ? !match(not)
                  : true
            return andBool && orBool && notBool
        }
        if (typeof m === 'string') {
            return m === toMatch
        } else if (m instanceof RegExp) {
            return m.test(toMatch)
        } else if (typeof m === 'function') {
            const res = m(toMatch, undefined)
            if (typeof res === 'boolean') {
                return res
            } else {
                return match(res)
            }
        } else if (typeof m === 'boolean') {
            return m
        } else {
            return condition(m)
        }
    }

    const status = {
        hit: false,
    } as {
        hit: boolean
        data?: ReturnType<Callback> | ReturnType<Callback>[]
        number?: number
    }
    for (const item of switcher) {
        if (!Array.isArray(item)) {
            const [matcher, callback] = switcher as [
                matcher: M,
                callback: Callback,
            ]
            const isMatched = match(matcher)
            if (isMatched) {
                return {
                    data: callback(),
                    hit: true,
                } as Ret<M, T, Callback, Options>
            }
            return {
                hit: false,
            } as Ret<M, T, Callback, Options>
        }

        const [matcher, callback] = item as [matcher: M, callback: Callback]
        const isMatched = match(matcher)
        if (isMatched) {
            status.hit = true
            const data = callback()
            if (options?.multiple) {
                status.data = [
                    ...((status.data || []) as ReturnType<Callback>[]),
                    data,
                ]
            } else {
                status.data = data
                break
            }
        }
    }
    return status as Ret<M, T, Callback, Options>
}
