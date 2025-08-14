import { SnakeCaseSeq } from '@repo/types/utils'

import snakeCase from 'lodash.snakecase'

export function keysToSnake<T extends Record<string, unknown>>(object: T) {
    return Object.keys(object).reduce(
        (acc, key) => {
            const snakeKey = snakeCase(key) as SnakeCaseSeq<
                keyof T extends string ? keyof T : never
            >
            acc[snakeKey as keyof typeof acc] = object[key]
            return acc
        },
        {} as Record<
            SnakeCaseSeq<keyof T extends string ? keyof T : never>,
            unknown
        >
    ) as T extends Record<string, unknown>
        ? {
              [K in keyof T as SnakeCaseSeq<K & string>]: T[K] extends Record<
                  string,
                  unknown
              >
                  ? T[K] extends Array<infer U>
                      ? U[]
                      : T[K]
                  : T[K]
          }
        : Record<string, unknown>
}
