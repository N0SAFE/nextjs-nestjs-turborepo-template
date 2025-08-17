import { describe, it, expect, vi } from 'vitest'
import { keysToSnake } from '../transformCase'

// Mock lodash.snakecase
vi.mock('lodash.snakecase', () => ({
    default: vi.fn((str: string) =>
        str
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '')
    ),
}))

describe('transformCase utilities', () => {
    describe('keysToSnake', () => {
        it('should transform object keys to snake_case', () => {
            const input = {
                firstName: 'John',
                lastName: 'Doe',
                userAge: 25,
                isActive: true,
            }

            const result = keysToSnake(input)

            expect(result).toEqual({
                first_name: 'John',
                last_name: 'Doe',
                user_age: 25,
                is_active: true,
            })
        })

        it('should handle empty objects', () => {
            const input = {}
            const result = keysToSnake(input)

            expect(result).toEqual({})
        })

        it('should handle objects with snake_case keys', () => {
            const input = {
                first_name: 'John',
                last_name: 'Doe',
            }

            const result = keysToSnake(input)

            expect(result).toEqual({
                first_name: 'John',
                last_name: 'Doe',
            })
        })

        it('should handle objects with mixed key formats', () => {
            const input = {
                firstName: 'John',
                last_name: 'Doe',
                userAge: 25,
                address_line_1: '123 Main St',
            }

            const result = keysToSnake(input)

            expect(result).toEqual({
                first_name: 'John',
                last_name: 'Doe',
                user_age: 25,
                address_line_1: '123 Main St',
            })
        })

        it('should preserve values of all types', () => {
            const input = {
                stringValue: 'test',
                numberValue: 42,
                booleanValue: true,
                nullValue: null,
                undefinedValue: undefined,
                objectValue: { nested: 'object' },
                arrayValue: [1, 2, 3],
            }

            const result = keysToSnake(input)

            expect(result.string_value).toBe('test')
            expect(result.number_value).toBe(42)
            expect(result.boolean_value).toBe(true)
            expect(result.null_value).toBeNull()
            expect(result.undefined_value).toBeUndefined()
            expect(result.object_value).toEqual({ nested: 'object' })
            expect(result.array_value).toEqual([1, 2, 3])
        })
    })
})
