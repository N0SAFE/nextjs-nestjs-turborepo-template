/**
 * Progress tracking utilities
 */

import { ProgressEvent } from '../types/index.js'

export type ProgressHandler = (event: ProgressEvent) => void | Promise<void>

export class ProgressTracker {
  private handlers: ProgressHandler[] = []
  private currentStage = ''
  private startTime = Date.now()

  on(handler: ProgressHandler): void {
    this.handlers.push(handler)
  }

  off(handler: ProgressHandler): void {
    this.handlers = this.handlers.filter(h => h !== handler)
  }

  async emit(event: ProgressEvent): Promise<void> {
    await Promise.all(this.handlers.map(handler => handler(event)))
  }

  async start(stage: string, message: string): Promise<void> {
    this.currentStage = stage
    await this.emit({
      type: 'started',
      stage,
      message,
    })
  }

  async progress(percentage: number, message: string, details?: Record<string, unknown>): Promise<void> {
    await this.emit({
      type: 'progress',
      stage: this.currentStage,
      message,
      progress: percentage,
      details,
    })
  }

  async complete(message: string, details?: Record<string, unknown>): Promise<void> {
    const duration = Date.now() - this.startTime
    await this.emit({
      type: 'completed',
      stage: this.currentStage,
      message,
      details: { ...details, duration },
    })
  }

  async error(message: string, details?: Record<string, unknown>): Promise<void> {
    await this.emit({
      type: 'error',
      stage: this.currentStage,
      message,
      details,
    })
  }

  async warning(message: string, details?: Record<string, unknown>): Promise<void> {
    await this.emit({
      type: 'warning',
      stage: this.currentStage,
      message,
      details,
    })
  }

  getElapsedTime(): number {
    return Date.now() - this.startTime
  }
}
