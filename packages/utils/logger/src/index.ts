/**
 * @fileoverview Pino-based logger for Next.js and NestJS applications
 *
 * Provides a unified logging interface across the monorepo with:
 * - Structured JSON logging in production
 * - Pretty-printed logs in development
 * - Scoped loggers for different modules
 * - All log levels: trace, debug, info, warn, error, fatal
 * - Sensitive data redaction
 * - Error serialization with automatic stack trace extraction
 * - Child loggers with context binding
 * - **Strongly typed method overloads** for Error objects
 *
 * @example
 * ```typescript
 * import { logger } from '@repo/logger'
 *
 * logger.info('User logged in', { userId: '123' })
 *
 * // Pass Error directly - message and stack extracted automatically
 * try {
 *   // ...
 * } catch (error) {
 *   logger.error(error)  // Logs error.message with full stack trace
 *   logger.error(error, { userId: '123' })  // With additional context
 * }
 *
 * const orpcLogger = logger.scope('ORPC')
 * orpcLogger.debug('Request sent', { method: 'GET', path: '/users' })
 *
 * const requestLogger = logger.child({ requestId: 'abc-123' })
 * requestLogger.info('Processing request')
 * ```
 */

import pino from 'pino'

// ============================================
// Types and Interfaces
// ============================================

/**
 * Log level type - all Pino log levels
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent'

/**
 * Base log data type - allows any record with unknown values
 */
export type LogData = Record<string, unknown>

/**
 * Extracted error information from Error objects
 */
export type ExtractedErrorInfo = {
  /** Error message */
  message: string
  /** Error name/type (e.g., 'TypeError', 'Error') */
  name: string
  /** Full stack trace */
  stack?: string
  /** Error cause if available (ES2022+) */
  cause?: unknown
}

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
export type LoggerOptions = {
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
  base?: LogData

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

// ============================================
// Logger Interface with Strongly Typed Overloads
// ============================================

/**
 * Logger instance interface with strongly typed method overloads
 *
 * Each logging method supports multiple signatures:
 * - `(message: string)` - Log a simple message
 * - `(message: string, data: LogData)` - Log message with structured data
 * - `(error: Error)` - Log error with automatic message/stack extraction
 * - `(error: Error, data: LogData)` - Log error with additional context
 * - `(message: string, error: Error)` - Log message with error as context
 */
export type Logger = {
  // ============================================
  // TRACE - Most verbose, detailed debugging
  // ============================================

  /**
   * Log trace message with no additional data
   * @param message - The log message
   */
  trace(message: string): void

  /**
   * Log trace message with structured data
   * @param message - The log message
   * @param data - Additional structured data
   */
  trace(message: string, data: LogData): void

  // ============================================
  // DEBUG - Development debugging
  // ============================================

  /**
   * Log debug message with no additional data
   * @param message - The log message
   */
  debug(message: string): void

  /**
   * Log debug message with structured data
   * @param message - The log message
   * @param data - Additional structured data
   */
  debug(message: string, data: LogData): void

  // ============================================
  // INFO - Informational messages
  // ============================================

  /**
   * Log info message with no additional data
   * @param message - The log message
   */
  info(message: string): void

  /**
   * Log info message with structured data
   * @param message - The log message
   * @param data - Additional structured data
   */
  info(message: string, data: LogData): void

  // ============================================
  // WARN - Warning messages (supports Error objects)
  // ============================================

  /**
   * Log warning message with no additional data
   * @param message - The log message
   */
  warn(message: string): void

  /**
   * Log warning message with structured data
   * @param message - The log message
   * @param data - Additional structured data
   */
  warn(message: string, data: LogData): void

  /**
   * Log warning with Error object - extracts message and stack automatically
   * @param error - The Error object (message and stack extracted automatically)
   */
  warn(error: Error): void

  /**
   * Log warning with Error object and additional context
   * @param error - The Error object (message and stack extracted automatically)
   * @param data - Additional structured context data
   */
  warn(error: Error, data: LogData): void

  /**
   * Log warning message with Error object as context
   * @param message - The warning message
   * @param error - The Error object to include in log data
   */
  warn(message: string, error: Error): void

  // ============================================
  // ERROR - Error messages (full Error object support)
  // ============================================

  /**
   * Log error with Error object - extracts message and stack automatically
   * @param error - The Error object (message and stack extracted automatically)
   *
   * @example
   * ```typescript
   * try {
   *   throw new Error('Connection failed')
   * } catch (err) {
   *   logger.error(err)  // Logs with full stack trace
   * }
   * ```
   */
  error(error: Error): void

  /**
   * Log error with Error object and additional context
   * @param error - The Error object (message and stack extracted automatically)
   * @param data - Additional structured context data
   *
   * @example
   * ```typescript
   * catch (err) {
   *   logger.error(err, { userId: '123', operation: 'fetchUser' })
   * }
   * ```
   */
  error(error: Error, data: LogData): void

  /**
   * Log error message with no additional data
   * @param message - The error message
   */
  error(message: string): void

  /**
   * Log error message with structured data
   * @param message - The error message
   * @param data - Additional structured data (can include 'err' key for Error object)
   */
  error(message: string, data: LogData): void

  /**
   * Log error message with Error object as context
   * @param message - The error message
   * @param error - The Error object to include in log data
   */
  error(message: string, error: Error): void

  // ============================================
  // FATAL - Fatal errors (should terminate)
  // ============================================

  /**
   * Log fatal error with Error object - extracts message and stack automatically
   * @param error - The Error object (message and stack extracted automatically)
   */
  fatal(error: Error): void

  /**
   * Log fatal error with Error object and additional context
   * @param error - The Error object (message and stack extracted automatically)
   * @param data - Additional structured context data
   */
  fatal(error: Error, data: LogData): void

  /**
   * Log fatal error message with no additional data
   * @param message - The error message
   */
  fatal(message: string): void

  /**
   * Log fatal error message with structured data
   * @param message - The error message
   * @param data - Additional structured data
   */
  fatal(message: string, data: LogData): void

  /**
   * Log fatal error message with Error object as context
   * @param message - The error message
   * @param error - The Error object to include in log data
   */
  fatal(message: string, error: Error): void

  // ============================================
  // Logger creation methods
  // ============================================

  /**
   * Create a scoped logger with a namespace prefix
   * @param namespace - The namespace to prefix all log messages
   *
   * @example
   * ```typescript
   * const orpcLogger = logger.scope('ORPC')
   * orpcLogger.debug('Request sent')  // Output: ORPC: Request sent
   * ```
   */
  scope(namespace: string): Logger

  /**
   * Create a child logger with bound context
   * Context is included in all subsequent logs from this logger
   * @param bindings - Context data to bind to all logs
   *
   * @example
   * ```typescript
   * const requestLogger = logger.child({ requestId: 'abc-123' })
   * requestLogger.info('Processing')  // Includes requestId in output
   * ```
   */
  child(bindings: LogData): Logger
}

// ============================================
// Helper Functions
// ============================================

/**
 * Extract error information from an Error object
 * @param error - The Error object to extract information from
 * @returns Extracted error information including message, name, stack, and cause
 */
export function extractErrorInfo(error: Error): ExtractedErrorInfo {
  return {
    message: error.message,
    name: error.name,
    stack: error.stack,
    cause: (error as Error & { cause?: unknown }).cause,
  }
}

/**
 * Check if a value is an Error object
 * @param value - The value to check
 * @returns True if the value is an Error object
 */
function isError(value: unknown): value is Error {
  return value instanceof Error
}

/**
 * Determine if we're in development mode
 */
const isDevelopment = process.env.NODE_ENV === 'development'

// ============================================
// Logger Factory
// ============================================

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
 * Create a logger instance that wraps Pino with strongly typed overloads
 */
function createLogger(options: LoggerOptions = {}, pinoInstance?: pino.Logger): Logger {
  const pinoLogger = pinoInstance ?? createPinoLogger(options)
  const scope = options.scope

  /**
   * Handle error-level logging with multiple signatures
   * Supports: Error, Error + data, string, string + data, string + Error
   */
  function handleErrorLog(
    pinoMethod: pino.LogFn,
    messageOrError: string | Error,
    dataOrError?: LogData | Error
  ): void {
    // Case 1: Error object as first parameter
    if (isError(messageOrError)) {
      const errorMessage = messageOrError.message
      const errorInfo = extractErrorInfo(messageOrError)

      // Case 1a: Error with additional context data
      if (dataOrError && !isError(dataOrError)) {
        pinoMethod(
          {
            err: messageOrError,
            errorInfo,
            ...dataOrError,
          },
          errorMessage
        )
      }
      // Case 1b: Just the Error object
      else {
        pinoMethod(
          {
            err: messageOrError,
            errorInfo,
          },
          errorMessage
        )
      }
    }
    // Case 2: String message with Error in second param
    else if (isError(dataOrError)) {
      const errorInfo = extractErrorInfo(dataOrError)
      pinoMethod(
        {
          err: dataOrError,
          errorInfo,
        },
        messageOrError
      )
    }
    // Case 3: String message with context data
    else if (dataOrError) {
      pinoMethod(dataOrError, messageOrError)
    }
    // Case 4: Just string message
    else {
      pinoMethod(messageOrError)
    }
  }

  /**
   * Handle warn-level logging with multiple signatures
   * Supports: Error, Error + data, string, string + data, string + Error
   */
  function handleWarnLog(
    messageOrError: string | Error,
    dataOrError?: LogData | Error
  ): void {
    // Case 1: Error object as first parameter
    if (isError(messageOrError)) {
      const errorMessage = messageOrError.message
      const errorInfo = extractErrorInfo(messageOrError)

      // Case 1a: Error with additional context data
      if (dataOrError && !isError(dataOrError)) {
        pinoLogger.warn(
          {
            err: messageOrError,
            errorInfo,
            ...dataOrError,
          },
          errorMessage
        )
      }
      // Case 1b: Just the Error object
      else {
        pinoLogger.warn(
          {
            err: messageOrError,
            errorInfo,
          },
          errorMessage
        )
      }
    }
    // Case 2: String message with Error in second param
    else if (isError(dataOrError)) {
      const errorInfo = extractErrorInfo(dataOrError)
      pinoLogger.warn(
        {
          err: dataOrError,
          errorInfo,
        },
        messageOrError
      )
    }
    // Case 3: String message with context data
    else if (dataOrError) {
      pinoLogger.warn(dataOrError, messageOrError)
    }
    // Case 4: Just string message
    else {
      pinoLogger.warn(messageOrError)
    }
  }

  return {
    // TRACE - simple string logging only
    trace(message: string, data?: LogData): void {
      if (data) {
        pinoLogger.trace(data, message)
      } else {
        pinoLogger.trace(message)
      }
    },

    // DEBUG - simple string logging only
    debug(message: string, data?: LogData): void {
      if (data) {
        pinoLogger.debug(data, message)
      } else {
        pinoLogger.debug(message)
      }
    },

    // INFO - simple string logging only
    info(message: string, data?: LogData): void {
      if (data) {
        pinoLogger.info(data, message)
      } else {
        pinoLogger.info(message)
      }
    },

    // WARN - supports Error objects
    warn(messageOrError: string | Error, dataOrError?: LogData | Error): void {
      handleWarnLog(messageOrError, dataOrError)
    },

    // ERROR - full Error object support with automatic extraction
    error(messageOrError: string | Error, dataOrError?: LogData | Error): void {
      handleErrorLog(pinoLogger.error.bind(pinoLogger), messageOrError, dataOrError)
    },

    // FATAL - full Error object support with automatic extraction
    fatal(messageOrError: string | Error, dataOrError?: LogData | Error): void {
      handleErrorLog(pinoLogger.fatal.bind(pinoLogger), messageOrError, dataOrError)
    },

    // Create scoped logger
    scope(namespace: string): Logger {
      const scopedName = scope ? `${scope}:${namespace}` : namespace
      return createLogger({ ...options, scope: scopedName })
    },

    // Create child logger with bound context
    child(bindings: LogData): Logger {
      const childPino = pinoLogger.child(bindings)
      return createLogger(options, childPino)
    },
  }
}

// ============================================
// Exports
// ============================================

/**
 * Default logger instance
 *
 * @example
 * ```typescript
 * import { logger } from '@repo/logger'
 *
 * // Basic logging
 * logger.info('Application started')
 *
 * // Error as first parameter (recommended) - FULLY TYPED
 * try {
 *   throw new Error('Connection failed')
 * } catch (err) {
 *   logger.error(err)  // Automatically extracts message and stack
 *   logger.error(err, { userId: '123', retry: 3 })  // With context
 * }
 *
 * // String message with error as second parameter
 * logger.error('Failed to connect', err)  // Error extracted as context
 *
 * // Traditional string message with data
 * logger.error('Custom error', { customField: 'value' })
 *
 * // With structured data
 * logger.info('User action', { userId: '123', action: 'login' })
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
