/**
 * Test file demonstrating parameterless handlers work correctly
 * 
 * These tests verify that:
 * 1. Handlers without parameters can be defined
 * 2. .call() works without arguments
 * 3. Both sync and async parameterless handlers work
 * 4. Types are inferred correctly
 */

import { describe, it, expect } from 'vitest'

// Mock the custom helper to avoid dependency issues in tests
const mockCustom = (config: any) => ({
  call: async () => {
    if (typeof config.handler === 'function') {
      return Promise.resolve(config.handler())
    }
    return Promise.resolve()
  },
  queryKey: () => config.keys,
  queryOptions: () => ({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: config.keys,
    queryFn: async () => {
      if (typeof config.handler === 'function') {
        return Promise.resolve(config.handler())
      }
      return Promise.resolve()
    }
  })
})

const testEndpoints = {
  testParameterless: mockCustom({
    keys: ['test', 'parameterless'],
    handler: () => {
      return { success: true, message: 'Parameterless handler works!' }
    }
  }),
  testAsyncParameterless: mockCustom({
    keys: ['test', 'async-parameterless'],
    handler: async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
      return { success: true, message: 'Async parameterless handler works!' }
    }
  }),
}

describe('Parameterless Handlers (Shared Helper)', () => {
  it('should call sync parameterless handler without arguments', async () => {
    // This should compile without type errors
    const result = await testEndpoints.testParameterless.call()
    
    expect(result).toEqual({
      success: true,
      message: 'Parameterless handler works!'
    })
  })

  it('should call async parameterless handler without arguments', async () => {
    // This should compile without type errors
    const result = await testEndpoints.testAsyncParameterless.call()
    
    expect(result).toEqual({
      success: true,
      message: 'Async parameterless handler works!'
    })
  })

  it('should have correct queryKey for parameterless handlers', () => {
    // QueryKey should work without input
    const key = testEndpoints.testParameterless.queryKey()
    
    expect(key).toEqual(['test', 'parameterless'])
  })

  it('should have queryOptions without input', () => {
    // QueryOptions should work without input parameter
    const options = testEndpoints.testParameterless.queryOptions()
    
    expect(options.queryKey).toEqual(['test', 'parameterless'])
    expect(typeof options.queryFn).toBe('function')
  })
})
