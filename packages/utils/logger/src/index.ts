/**
 * @fileoverview Pino-based logger for Next.js and NestJS applications
 * 
 * Provides a unified logging interface across the monorepo with:
 * - Structured JSON logging in production
 * - Pretty-printed logs in development
 * - Scoped loggers for different modules
 * - All log levels: trace, debug, info, warn, error, fatal
 * - Sensitive data redaction
 * - Error serialization
 * - Child loggers with context binding
 * 
 * @example
 * ```typescript
 * import { logger } from '@repo/logger'
 * 
 * logger.info('User logged in', { userId: '123' })
 * logger.error('Failed to fetch data', { error: err.message })
 * 
 * const orpcLogger = logger.scope('ORPC')
 * orpcLogger.debug('Request sent', { method: 'GET', path: '/users' })
 * 
 * const requestLogger = logger.child({ requestId: 'abc-123' })
 * requestLogger.info('Processing request')
 * ```
 */

import pino from 'pino'

/**
 * Log level type - all Pino log levels
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent'

/**
 * Sensitive field paths to redact from logs
 */
export const DEFAULT_REDACT_PATHS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
  'cookie',
  'set-cookie',
  '*.password',
  '*.token',
  '*.secret',
  '*.apiKey',
  '*.api_key',
  'req.headers.authorization',
  'req.headers.cookie',
]

/**
 * Logger configuration options
 */
export interface LoggerOptions {
  /**
   * Minimum log level to display
   * @default 'info' in production, 'debug' in development
   */
  level?: LogLevel
  
  /**
   * Enable pretty printing (auto-detected based on NODE_ENV)
   * @default true in development, false in production
   */
  pretty?: boolean
  
  /**
   * Scope/namespace for the logger
   */
  scope?: string
  
  /**
   * Base context to include in all logs
   */
  base?: Record<string, unknown>
  
  /**
   * Paths to redact from logs (security)
   * @default DEFAULT_REDACT_PATHS
   */
  redact?: string[]
  
  /**
   * Enable automatic error serialization
   * @default true
   */
  serializers?: boolean
}

/**
 * Logger instance interface
 */
export interface Logger {
  /**
   * Log trace message (most verbose, for detailed debugging)
   */
  trace(message: string, data?: Record<string, unknown>): void
  
  /**
   * Log debug message (development only)
   */
  debug(message: string, data?: Record<string, unknown>): void
  
  /**
   * Log informational message
   */
  info(message: string, data?: Record<string, unknown>): void
  
  /**
   * Log warning message
   */
  warn(message: string, data?: Record<string, unknown>): void
  
  /**
   * Log error message
   */
  error(message: string, data?: Record<string, unknown> | Error): void
  
  /**
   * Log fatal error (should terminate process)
   */
  fatal(message: string, data?: Record<string, unknown> | Error): void
  
  /**
   * Create a scoped logger with a namespace prefix
   */
  scope(namespace: string): Logger
  
  /**
   * Create a child logger with bound context
   * Context is included in all subsequent logs from this logger
   */
  child(bindings: Record<string, unknown>): Logger
}

/**
 * Determine if we're in development mode
 */
const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Create a Pino logger instance with the provided options
 */
function createPinoLogger(options: LoggerOptions = {}): pino.Logger {
  const {
    level = isDevelopment ? 'debug' : 'info',
    pretty = isDevelopment,
    scope,
    base = {},
    redact = DEFAULT_REDACT_PATHS,
    serializers = true,
  } = options

  const pinoOptions: pino.LoggerOptions = {
    level,
    base: {
      ...base,
      ...(scope && { name: scope }),
    },
    redact: {
      paths: redact,
      censor: '[REDACTED]',
    },
    ...(serializers && {
      serializers: {
        err: pino.stdSerializers.err,
        error: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
      },
    }),
  }

  // In development, use pretty printing
  if (pretty) {
    return pino({
      ...pinoOptions,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          messageFormat: scope ? '{name}: {msg}' : '{msg}',
          errorLikeObjectKeys: ['err', 'error'],
        },
      },
    })
  }

  // In production, use JSON format
  return pino(pinoOptions)
}

/**
 * Create a logger instance that wraps Pino
 */
function createLogger(options: LoggerOptions = {}, pinoInstance?: pino.Logger): Logger {
  const pinoLogger = pinoInstance || createPinoLogger(options)
  const scope = options.scope

  return {
    trace(message: string, data?: Record<string, unknown>): void {
      if (data) {
        pinoLogger.trace(data, message)
      } else {
        pinoLogger.trace(message)
      }
    },

    debug(message: string, data?: Record<string, unknown>): void {
      if (data) {
        pinoLogger.debug(data, message)
      } else {
        pinoLogger.debug(message)
      }
    },

    info(message: string, data?: Record<string, unknown>): void {
      if (data) {
        pinoLogger.info(data, message)
      } else {
        pinoLogger.info(message)
      }
    },

    warn(message: string, data?: Record<string, unknown>): void {
      if (data) {
        pinoLogger.warn(data, message)
      } else {
        pinoLogger.warn(message)
      }
    },

    error(message: string, data?: Record<string, unknown> | Error): void {
      if (data instanceof Error) {
        pinoLogger.error({ err: data }, message)
      } else if (data) {
        pinoLogger.error(data, message)
      } else {
        pinoLogger.error(message)
      }
    },

    fatal(message: string, data?: Record<string, unknown> | Error): void {
      if (data instanceof Error) {
        pinoLogger.fatal({ err: data }, message)
      } else if (data) {
        pinoLogger.fatal(data, message)
      } else {
        pinoLogger.fatal(message)
      }
    },

    scope(namespace: string): Logger {
      const scopedName = scope ? `${scope}:${namespace}` : namespace
      return createLogger({ ...options, scope: scopedName })
    },

    child(bindings: Record<string, unknown>): Logger {
      const childPino = pinoLogger.child(bindings)
      return createLogger(options, childPino)
    },
  }
}

/**
 * Default logger instance
 * 
 * @example
 * ```typescript
 * import { logger } from '@repo/logger'
 * 
 * // Basic logging
 * logger.info('Application started')
 * logger.error('Failed to connect', { error: err.message })
 * 
 * // With structured data
 * logger.info('User action', { userId: '123', action: 'login' })
 * 
 * // Error logging with Error object
 * try {
 *   // ... some code
 * } catch (err) {
 *   logger.error('Operation failed', err)
 * }
 * ```
 */
export const logger = createLogger()

/**
 * Create a custom logger instance with specific options
 * 
 * @example
 * ```typescript
 * import { createLogger } from '@repo/logger'
 * 
 * // Custom scope
 * const apiLogger = createLogger({ scope: 'API', level: 'debug' })
 * apiLogger.info('Request received')
 * 
 * // With base context
 * const appLogger = createLogger({
 *   scope: 'App',
 *   base: { version: '1.0.0', env: 'production' }
 * })
 * 
 * // Child logger with request context
 * const requestLogger = apiLogger.child({ requestId: 'abc-123' })
 * requestLogger.info('Processing request') // Includes requestId
 * 
 * // Custom redaction
 * const secureLogger = createLogger({
 *   redact: ['creditCard', 'ssn', '*.sensitive']
 * })
 * ```
 */
export { createLogger }
