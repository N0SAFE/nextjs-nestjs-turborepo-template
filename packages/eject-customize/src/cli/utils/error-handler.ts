/**
 * Error Handler Utility
 * Provides consistent error handling and formatting for CLI
 */

import { error, warning, info } from '../output/formatter'

/**
 * Custom CLI error
 */
export class CLIError extends Error {
  constructor(
    message: string,
    public code: number = 1,
    public hint?: string
  ) {
    super(message)
    this.name = 'CLIError'
  }
}

/**
 * Validation error
 */
export class ValidationError extends CLIError {
  constructor(message: string, hint?: string) {
    super(message, 2, hint)
    this.name = 'ValidationError'
  }
}

/**
 * File operation error
 */
export class FileOperationError extends CLIError {
  constructor(message: string, hint?: string) {
    super(message, 3, hint)
    this.name = 'FileOperationError'
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends CLIError {
  constructor(message: string, hint?: string) {
    super(message, 4, hint)
    this.name = 'ConfigurationError'
  }
}

/**
 * Framework error
 */
export class FrameworkError extends CLIError {
  constructor(message: string, hint?: string) {
    super(message, 5, hint)
    this.name = 'FrameworkError'
  }
}

/**
 * Handle and display error
 */
export function handleError(err: unknown, context?: string): void {
  let message = 'Unknown error'
  let code = 1
  let hint: string | undefined

  if (err instanceof CLIError) {
    message = err.message
    code = err.code
    hint = err.hint
  } else if (err instanceof Error) {
    message = err.message
  } else if (typeof err === 'string') {
    message = err
  }

  // Display error with context
  if (context) {
    console.error(error(`${context}: ${message}`))
  } else {
    console.error(error(message))
  }

  // Display hint if available
  if (hint) {
    console.error(info(`💡 Hint: ${hint}`))
  }

  // Display error code if not standard
  if (code !== 1) {
    console.error(info(`Error code: ${code}`))
  }

  // Show debug info if available
  if (process.env.DEBUG && err instanceof Error && err.stack) {
    console.error(info('Stack trace:'))
    console.error(err.stack)
  }
}

/**
 * Validate required options
 */
export function validateRequired(
  options: Record<string, unknown>,
  required: string[],
  context?: string
): void {
  const missing = required.filter((key) => !options[key])

  if (missing.length > 0) {
    const hint = `Required options: ${required.join(', ')}`
    throw new ValidationError(
      `Missing required ${context || 'options'}: ${missing.join(', ')}`,
      hint
    )
  }
}

/**
 * Validate file path
 */
export function validateFilePath(filePath: string, context?: string): void {
  if (!filePath) {
    throw new ValidationError(`File path is required${context ? ` (${context})` : ''}`)
  }

  if (filePath.includes('..')) {
    throw new ValidationError(
      `Invalid file path: path traversal not allowed${context ? ` (${context})` : ''}`,
      'Use absolute or relative paths within project'
    )
  }
}

/**
 * Validate directory path
 */
export function validateDirectoryPath(dirPath: string, context?: string): void {
  if (!dirPath) {
    throw new ValidationError(`Directory path is required${context ? ` (${context})` : ''}`)
  }

  validateFilePath(dirPath, context)
}

/**
 * Validate URL
 */
export function validateURL(url: string, context?: string): void {
  try {
    new URL(url)
  } catch {
    throw new ValidationError(
      `Invalid URL: ${url}${context ? ` (${context})` : ''}`,
      'Ensure URL is valid and includes protocol (http:// or https://)'
    )
  }
}

/**
 * Validate enum value
 */
export function validateEnum(
  value: string,
  validValues: string[],
  context?: string
): void {
  if (!validValues.includes(value)) {
    throw new ValidationError(
      `Invalid ${context || 'value'}: ${value}`,
      `Must be one of: ${validValues.join(', ')}`
    )
  }
}

/**
 * Create error summary
 */
export function createErrorSummary(errors: Error[]): string {
  if (errors.length === 0) {
    return 'No errors'
  }

  if (errors.length === 1) {
    return errors[0].message
  }

  const lines = [`${errors.length} errors found:`]
  errors.forEach((err, index) => {
    lines.push(`  ${index + 1}. ${err.message}`)
  })

  return lines.join('\n')
}

/**
 * Ensure async function error handling
 */
export function wrapAsync<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>
): (...args: Args) => Promise<R> {
  return async (...args: Args): Promise<R> => {
    try {
      return await fn(...args)
    } catch (err) {
      handleError(err)
      throw err
    }
  }
}

export default {
  CLIError,
  ValidationError,
  FileOperationError,
  ConfigurationError,
  FrameworkError,
  handleError,
  validateRequired,
  validateFilePath,
  validateDirectoryPath,
  validateURL,
  validateEnum,
  createErrorSummary,
  wrapAsync,
}
