/**
 * Error Type Definitions
 *
 * Custom error classes for the scaffold CLI.
 */

/**
 * Base error class for scaffold CLI
 */
export class ScaffoldError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ScaffoldError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Configuration validation error
 */
export class ConfigValidationError extends ScaffoldError {
  constructor(
    public readonly validationErrors: string[] | ValidationErrorDetail[],
    message?: string,
  ) {
    super(
      message ?? `Configuration validation failed: ${Array.isArray(validationErrors) && typeof validationErrors[0] === "string" ? validationErrors.join(", ") : "see errors"}`,
      "CONFIG_VALIDATION_ERROR",
      { validationErrors },
    );
    this.name = "ConfigValidationError";
  }
}

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  /** Field path that has the error */
  path: string;
  /** Error message */
  message: string;
  /** Expected value/type */
  expected?: string;
  /** Received value */
  received?: unknown;
}

/**
 * Plugin not found error
 */
export class PluginNotFoundError extends ScaffoldError {
  constructor(
    public readonly pluginId: string,
    public readonly availablePlugins?: string[],
  ) {
    super(`Plugin not found: ${pluginId}`, "PLUGIN_NOT_FOUND", {
      pluginId,
      availablePlugins,
    });
    this.name = "PluginNotFoundError";
  }
}

/**
 * Plugin dependency error
 */
export class PluginDependencyError extends ScaffoldError {
  constructor(
    public readonly pluginId: string,
    public readonly missingDependencies: string[],
  ) {
    super(
      `Plugin "${pluginId}" requires: ${missingDependencies.join(", ")}`,
      "PLUGIN_DEPENDENCY_ERROR",
      { pluginId, missingDependencies },
    );
    this.name = "PluginDependencyError";
  }
}

/**
 * Plugin conflict error
 */
export class PluginConflictError extends ScaffoldError {
  constructor(
    public readonly pluginId: string,
    public readonly conflictsWith: string[],
  ) {
    super(
      `Plugin "${pluginId}" conflicts with: ${conflictsWith.join(", ")}`,
      "PLUGIN_CONFLICT_ERROR",
      { pluginId, conflictsWith },
    );
    this.name = "PluginConflictError";
  }
}

/**
 * Generator error
 */
export class GeneratorError extends ScaffoldError {
  constructor(
    public readonly pluginId: string,
    message: string,
    public readonly phase?: string,
  ) {
    super(
      `Generator error for "${pluginId}": ${message}`,
      "GENERATOR_ERROR",
      { pluginId, phase },
    );
    this.name = "GeneratorError";
  }
}

/**
 * Template error
 */
export class TemplateError extends ScaffoldError {
  constructor(
    public readonly templateName: string,
    message: string,
    public readonly templatePath?: string,
  ) {
    super(
      `Template error in "${templateName}": ${message}`,
      "TEMPLATE_ERROR",
      { templateName, templatePath },
    );
    this.name = "TemplateError";
  }
}

/**
 * File system error
 */
export class FileSystemError extends ScaffoldError {
  constructor(
    public readonly operation: string,
    public readonly filePath: string,
    message: string,
  ) {
    super(
      `File system error (${operation}) at "${filePath}": ${message}`,
      "FILE_SYSTEM_ERROR",
      { operation, filePath },
    );
    this.name = "FileSystemError";
  }
}

/**
 * Project already exists error
 */
export class ProjectExistsError extends ScaffoldError {
  constructor(
    public readonly projectPath: string,
    public readonly projectName?: string,
  ) {
    super(
      `Project already exists at: ${projectPath}`,
      "PROJECT_EXISTS_ERROR",
      { projectPath, projectName },
    );
    this.name = "ProjectExistsError";
  }
}

/**
 * Command execution error
 */
export class CommandExecutionError extends ScaffoldError {
  constructor(
    public readonly command: string,
    public readonly exitCode?: number,
    public readonly stderr?: string,
  ) {
    super(
      `Command failed: ${command}${exitCode ? ` (exit code: ${exitCode})` : ""}${stderr ? ` - ${stderr}` : ""}`,
      "COMMAND_EXECUTION_ERROR",
      { command, exitCode, stderr },
    );
    this.name = "CommandExecutionError";
  }
}

/**
 * User cancelled error
 */
export class UserCancelledError extends ScaffoldError {
  constructor(public readonly reason?: string) {
    super(
      reason ? `Operation cancelled: ${reason}` : "Operation cancelled by user",
      "USER_CANCELLED",
      { reason },
    );
    this.name = "UserCancelledError";
  }
}

/**
 * Invalid argument error
 */
export class InvalidArgumentError extends ScaffoldError {
  constructor(
    public readonly argumentName: string,
    message: string,
    public readonly receivedValue?: unknown,
  ) {
    super(
      `Invalid argument "${argumentName}": ${message}`,
      "INVALID_ARGUMENT",
      { argumentName, receivedValue },
    );
    this.name = "InvalidArgumentError";
  }
}

/**
 * Type guard for ScaffoldError
 */
export function isScaffoldError(error: unknown): error is ScaffoldError {
  return error instanceof ScaffoldError;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (isScaffoldError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Get error code
 */
export function getErrorCode(error: unknown): string {
  if (isScaffoldError(error)) {
    return error.code;
  }
  if (error instanceof Error) {
    return error.name;
  }
  return "UNKNOWN_ERROR";
}
