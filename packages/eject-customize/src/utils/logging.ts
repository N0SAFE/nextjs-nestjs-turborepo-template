/**
 * Logging utilities
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export class Logger {
  private logs: LogEntry[] = []
  private level: LogLevel

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    if (level < this.level) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    }

    this.logs.push(entry)

    // Also output to console in development
    if (process.env.NODE_ENV === 'development') {
      const prefix = LogLevel[level]
      console.log(`[${prefix}] ${message}`, metadata || '')
    }
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, metadata)
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, metadata)
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, metadata)
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, metadata)
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (!level) return this.logs
    return this.logs.filter(log => log.level >= level)
  }

  clear(): void {
    this.logs = []
  }

  setLevel(level: LogLevel): void {
    this.level = level
  }
}

export const defaultLogger = new Logger()
