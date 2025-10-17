import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ProgressTracker } from '../src/utils/progress-utils.js'
import type { ProgressEvent } from '../src/types/index.js'

describe('Progress Utilities', () => {
  let tracker: ProgressTracker

  beforeEach(() => {
    tracker = new ProgressTracker()
  })

  describe('ProgressTracker', () => {
    it('should register and call handlers', async () => {
      const handler = vi.fn()
      tracker.on(handler)

      await tracker.start('test', 'Starting')

      expect(handler).toHaveBeenCalled()
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'started',
          stage: 'test',
          message: 'Starting',
        })
      )
    })

    it('should support multiple handlers', async () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      tracker.on(handler1)
      tracker.on(handler2)

      await tracker.start('test', 'Starting')

      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it('should unregister handlers', async () => {
      const handler = vi.fn()
      tracker.on(handler)
      tracker.off(handler)

      await tracker.start('test', 'Starting')

      expect(handler).not.toHaveBeenCalled()
    })

    it('should emit progress events', async () => {
      const handler = vi.fn()
      tracker.on(handler)

      await tracker.progress(50, 'Half done', { processed: 50 })

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'progress',
          progress: 50,
          message: 'Half done',
          details: { processed: 50 },
        })
      )
    })

    it('should emit completion events', async () => {
      const handler = vi.fn()
      tracker.on(handler)

      await tracker.complete('Finished', { total: 100 })

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'completed',
          message: 'Finished',
          details: expect.objectContaining({ total: 100 }),
        })
      )
    })

    it('should emit error events', async () => {
      const handler = vi.fn()
      tracker.on(handler)

      await tracker.error('Something failed', { code: 'ERR_001' })

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'Something failed',
          details: { code: 'ERR_001' },
        })
      )
    })

    it('should emit warning events', async () => {
      const handler = vi.fn()
      tracker.on(handler)

      await tracker.warning('Warning message', { severity: 'low' })

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          message: 'Warning message',
          details: { severity: 'low' },
        })
      )
    })

    it('should track elapsed time', async () => {
      await tracker.start('test', 'Starting')

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50))

      const elapsed = tracker.getElapsedTime()

      expect(elapsed).toBeGreaterThanOrEqual(50)
      expect(elapsed).toBeLessThan(200)
    })

    it('should include duration in completion event', async () => {
      const handler = vi.fn()
      tracker.on(handler)

      await tracker.start('test', 'Starting')
      await new Promise(resolve => setTimeout(resolve, 50))
      await tracker.complete('Done')

      const completionCall = handler.mock.calls.find(
        call => call[0].type === 'completed'
      )

      expect(completionCall[0].details).toHaveProperty('duration')
      expect(completionCall[0].details.duration).toBeGreaterThanOrEqual(50)
    })

    it('should maintain current stage across events', async () => {
      const handler = vi.fn()
      tracker.on(handler)

      await tracker.start('stage1', 'Starting stage 1')
      await tracker.progress(50, 'Progress in stage 1')

      const progressCall = handler.mock.calls.find(
        call => call[0].type === 'progress'
      )

      expect(progressCall[0].stage).toBe('stage1')
    })

    it('should handle async handlers', async () => {
      const handler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      tracker.on(handler)

      await expect(tracker.start('test', 'Starting')).resolves.not.toThrow()
    })

    it('should handle handler errors gracefully', async () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error')
      })

      tracker.on(errorHandler)

      await expect(tracker.start('test', 'Starting')).rejects.toThrow()
    })

    it('should track multiple operations sequentially', async () => {
      const handler = vi.fn()
      tracker.on(handler)

      await tracker.start('op1', 'Starting operation 1')
      await tracker.complete('Operation 1 complete')

      await tracker.start('op2', 'Starting operation 2')
      await tracker.complete('Operation 2 complete')

      const startCalls = handler.mock.calls.filter(
        call => call[0].type === 'started'
      )

      expect(startCalls.length).toBe(2)
      expect(startCalls[0][0].stage).toBe('op1')
      expect(startCalls[1][0].stage).toBe('op2')
    })
  })

  describe('Progress event details', () => {
    it('should include all event properties', async () => {
      const events: ProgressEvent[] = []
      tracker.on(async (event) => {
        events.push(event)
      })

      await tracker.start('test', 'Test message')
      await tracker.progress(25, 'Quarter done', { items: 25 })
      await tracker.progress(50, 'Half done', { items: 50 })
      await tracker.complete('Finished', { items: 100 })

      expect(events.length).toBe(4)
      expect(events[0]).toHaveProperty('type', 'started')
      expect(events[1]).toHaveProperty('progress', 25)
      expect(events[3]).toHaveProperty('type', 'completed')
    })
  })
})
