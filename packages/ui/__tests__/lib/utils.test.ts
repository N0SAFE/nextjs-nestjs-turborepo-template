import { describe, expect, it } from 'vitest'
import { cn } from '@repo/ui/lib/utils'

describe('cn utility function', () => {
    it('should merge class names correctly', () => {
        const result = cn('text-red-500', 'bg-blue-500')
        expect(result).toBe('text-red-500 bg-blue-500')
    })

    it('should handle conditional classes', () => {
        const condition = false
        const result = cn('text-red-500', condition && 'hidden', 'bg-blue-500')
        expect(result).toBe('text-red-500 bg-blue-500')
    })

    it('should handle undefined and null values', () => {
        const result = cn('text-red-500', undefined, null, 'bg-blue-500')
        expect(result).toBe('text-red-500 bg-blue-500')
    })

    it('should merge conflicting Tailwind classes', () => {
        const result = cn('text-red-500', 'text-blue-500')
        expect(result).toBe('text-blue-500')
    })

    it('should handle arrays and objects', () => {
        const result = cn(['text-red-500', 'bg-blue-500'], {
            'font-bold': true,
            italic: false,
        })
        expect(result).toBe('text-red-500 bg-blue-500 font-bold')
    })

    it('should handle empty inputs', () => {
        const result = cn()
        expect(result).toBe('')
    })

    it('should handle complex combinations', () => {
        const disabled = false
        const result = cn(
            'px-4 py-2',
            'text-white',
            'bg-blue-500',
            'hover:bg-blue-600',
            'disabled:opacity-50',
            { 'cursor-pointer': true },
            disabled && 'hidden'
        )
        expect(result).toContain('px-4')
        expect(result).toContain('py-2')
        expect(result).toContain('text-white')
        expect(result).toContain('bg-blue-500')
        expect(result).toContain('hover:bg-blue-600')
        expect(result).toContain('disabled:opacity-50')
        expect(result).toContain('cursor-pointer')
        expect(result).not.toContain('hidden')
    })
})
