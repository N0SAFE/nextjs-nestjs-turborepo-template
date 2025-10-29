import { SnakeCaseSeq } from '@repo/types/utils'

import snakeCase from 'lodash.snakecase'

export function keysToSnake<T extends Record<string, unknown>>(object: T) {
    return Object.keys(object).reduce<Record<
            SnakeCaseSeq<keyof T extends string ? keyof T : never>,
            unknown
        >>(
        (acc, key) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const snakeKey = snakeCase(key) as SnakeCaseSeq<
                keyof T extends string ? keyof T : never
            >
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            acc[snakeKey as keyof typeof acc] = object[key]
            return acc
        },
        {}
    ) as T extends Record<string, unknown>
        ? {
              [K in keyof T as SnakeCaseSeq<K & string>]: T[K] extends Record<
                  string,
                  unknown
              >
                  ? T[K] extends (infer U)[]
                      ? U[]
                      : T[K]
                  : T[K]
          }
        : Record<string, unknown>
}
