import { describe, it, expect } from 'vitest'

describe('Integration tests', () => {
    it('should be able to import utilities', async () => {
        const transformCase = await import('../utils/transformCase')
        expect(transformCase.keysToSnake).toBeDefined()
        expect(typeof transformCase.keysToSnake).toBe('function')
    })

    it('should be able to import TanStack Query utilities', async () => {
        const tanstackQuery = await import('../utils/tanstack-query')
        expect(tanstackQuery.toUseQuery).toBeDefined()
        expect(tanstackQuery.toUseMutation).toBeDefined()
        expect(typeof tanstackQuery.toUseQuery).toBe('function')
        expect(typeof tanstackQuery.toUseMutation).toBe('function')
    })

    it('should be able to import middleware', async () => {
        const withEnv = await import('../middlewares/WithEnv')
        expect(withEnv.default).toBeDefined()
        expect(typeof withEnv.default).toBe('function')
    })
})
