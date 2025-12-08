/**
 * Config Validator Service
 *
 * Handles validation of project configuration using Zod schemas.
 */
import { Injectable } from "@nestjs/common";
import { z } from "zod";
import {
  ProjectConfigSchema,
  type ProjectConfigInput,
  type ProjectConfigOutput,
} from "./schemas/project-config.schema";
import type { ProjectConfig, GitConfig as GitConfigType, CiConfig as CiConfigType } from "../../types/config.types";
import { ConfigValidationError, type ValidationErrorDetail } from "../../types/errors.types";

/** Validation result for async validation */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: ProjectConfigOutput;
}

@Injectable()
export class ConfigValidatorService {
  /**
   * Validate project configuration (throws on error)
   */
  validate(input: Partial<ProjectConfigInput>): ProjectConfigOutput {
    const result = ProjectConfigSchema.safeParse(input);

    if (!result.success) {
      const issues: ValidationErrorDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      throw new ConfigValidationError(issues);
    }

    return result.data;
  }

  /**
   * Validate project configuration asynchronously (returns result object)
   */
  async validateAsync(input: ProjectConfig | Partial<ProjectConfigInput>): Promise<ValidationResult> {
    // Normalize git config
    const gitConfig = input.git as GitConfigType | undefined;
    const normalizedGit = gitConfig ? {
      init: gitConfig.init ?? true,
      initialBranch: gitConfig.defaultBranch ?? "main",
      createReadme: true,
      createGitignore: gitConfig.gitignore ?? true,
    } : undefined;

    // Normalize CI config
    const ciConfig = input.ci as CiConfigType | undefined;
    let ciProvider: "github" | "gitlab" | "none" = "github";
    if (ciConfig?.provider === "github-actions") ciProvider = "github";
    else if (ciConfig?.provider === "gitlab-ci") ciProvider = "gitlab";
    else if (ciConfig?.provider === "none") ciProvider = "none";

    const normalizedCi = ciConfig ? {
      enabled: ciConfig.enabled ?? true,
      provider: ciProvider,
      setupDependabot: true,
    } : undefined;

    // Convert ProjectConfig to ProjectConfigInput format
    const normalizedInput: Partial<ProjectConfigInput> = {
      name: input.name ?? (input as ProjectConfig).projectName,
      description: input.description ?? "",
      author: input.author,
      license: input.license ?? "MIT",
      template: (input.template as ProjectConfigInput["template"]) ?? "fullstack",
      packageManager: input.packageManager ?? "bun",
      database: input.database ?? "postgresql",
      plugins: input.plugins ?? (input as ProjectConfig).features ?? {},
      ports: input.ports as ProjectConfigInput["ports"],
      docker: input.docker ? {
        enabled: input.docker.enabled ?? true,
        composeVersion: input.docker.composeVersion ?? "3.8",
        useSwarm: false,
      } : undefined,
      git: normalizedGit,
      ci: normalizedCi,
    };

    const result = ProjectConfigSchema.safeParse(normalizedInput);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => 
        `${issue.path.join(".")}: ${issue.message}`
      );
      return { valid: false, errors };
    }

    return { valid: true, errors: [], data: result.data };
  }

  /**
   * Validate a partial configuration (for updates)
   */
  validatePartial(input: unknown): Partial<ProjectConfigInput> {
    const result = ProjectConfigSchema.partial().safeParse(input);

    if (!result.success) {
      const issues: ValidationErrorDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      throw new ConfigValidationError(issues);
    }

    return result.data;
  }

  /**
   * Validate a single field
   */
  validateField<K extends keyof ProjectConfigInput>(
    field: K,
    value: unknown,
  ): ProjectConfigInput[K] {
    const fieldSchema = ProjectConfigSchema.shape[field] as z.ZodTypeAny;
    const result = fieldSchema.safeParse(value);

    if (!result.success) {
      const errorMessages = result.error.issues.map((i) => i.message);
      throw new ConfigValidationError(
        errorMessages,
        `Invalid value for ${field}`
      );
    }

    return result.data as ProjectConfigInput[K];
  }

  /**
   * Check if a project name is valid
   */
  isValidProjectName(name: string): { valid: boolean; error?: string } {
    const nameSchema = ProjectConfigSchema.shape.name;
    const result = nameSchema.safeParse(name);

    if (!result.success) {
      return {
        valid: false,
        error: result.error.issues[0]?.message ?? "Invalid project name",
      };
    }

    return { valid: true };
  }

  /**
   * Check if a version string is valid
   */
  isValidVersion(version: string): { valid: boolean; error?: string } {
    const versionSchema = ProjectConfigSchema.shape.version;
    const result = versionSchema.safeParse(version);

    if (!result.success) {
      return {
        valid: false,
        error: result.error.issues[0]?.message ?? "Invalid version format",
      };
    }

    return { valid: true };
  }

  /**
   * Coerce a value to the expected type for a field
   */
  coerceValue<K extends keyof ProjectConfigInput>(
    field: K,
    value: unknown,
  ): ProjectConfigInput[K] | null {
    try {
      const fieldSchema = ProjectConfigSchema.shape[field] as z.ZodTypeAny;

      // Try to coerce common types
      if (typeof value === "string") {
        // Boolean coercion
        if (fieldSchema instanceof z.ZodBoolean) {
          const lower = value.toLowerCase();
          if (lower === "true" || lower === "yes" || lower === "1") {
            return true as unknown as ProjectConfigInput[K];
          }
          if (lower === "false" || lower === "no" || lower === "0") {
            return false as unknown as ProjectConfigInput[K];
          }
        }

        // Check for ZodDefault wrapping a boolean
        if (fieldSchema instanceof z.ZodDefault) {
          const innerType = fieldSchema._def.innerType;
          if (innerType instanceof z.ZodBoolean) {
            const lower = value.toLowerCase();
            if (lower === "true" || lower === "yes" || lower === "1") {
              return true as unknown as ProjectConfigInput[K];
            }
            if (lower === "false" || lower === "no" || lower === "0") {
              return false as unknown as ProjectConfigInput[K];
            }
          }
        }

        // Array coercion (comma-separated)
        if (fieldSchema instanceof z.ZodArray) {
          return value.split(",").map((s) => s.trim()) as unknown as ProjectConfigInput[K];
        }
      }

      // Try direct validation
      return this.validateField(field, value);
    } catch {
      return null;
    }
  }

  /**
   * Get the schema for a specific field
   */
  getFieldSchema<K extends keyof ProjectConfigInput>(
    field: K,
  ): z.ZodTypeAny {
    return ProjectConfigSchema.shape[field] as z.ZodTypeAny;
  }

  /**
   * Get default value for a field
   */
  getDefaultValue<K extends keyof ProjectConfigInput>(
    field: K,
  ): ProjectConfigInput[K] | undefined {
    const fieldSchema = ProjectConfigSchema.shape[field] as z.ZodTypeAny;

    if (fieldSchema instanceof z.ZodDefault) {
      const defaultFn = fieldSchema._def.defaultValue;
      if (typeof defaultFn === "function") {
        return defaultFn() as ProjectConfigInput[K];
      }
      return defaultFn as ProjectConfigInput[K];
    }

    return undefined;
  }

  /**
   * Get all default values
   */
  getDefaults(): Partial<ProjectConfigInput> {
    const defaults: Partial<ProjectConfigInput> = {};
    const shape = ProjectConfigSchema.shape;

    for (const [key, schema] of Object.entries(shape)) {
      const zodSchema = schema as z.ZodTypeAny;
      if (zodSchema instanceof z.ZodDefault) {
        const defaultFn = zodSchema._def.defaultValue;
        if (typeof defaultFn === "function") {
          (defaults as Record<string, unknown>)[key] = defaultFn();
        } else {
          (defaults as Record<string, unknown>)[key] = defaultFn;
        }
      }
    }

    return defaults;
  }

  /**
   * Get field description/metadata
   */
  getFieldInfo(field: keyof ProjectConfigInput): {
    type: string;
    required: boolean;
    default?: unknown;
    description?: string;
  } {
    let schema = ProjectConfigSchema.shape[field] as z.ZodTypeAny;
    let type = "unknown";
    let required = true;
    let defaultValue: unknown;

    // Unwrap default
    if (schema instanceof z.ZodDefault) {
      const defaultFn = schema._def.defaultValue;
      defaultValue = typeof defaultFn === "function" ? defaultFn() : defaultFn;
      schema = schema._def.innerType as z.ZodTypeAny;
    }

    // Unwrap optional
    if (schema instanceof z.ZodOptional) {
      required = false;
      schema = schema._def.innerType as z.ZodTypeAny;
    }

    // Determine type
    if (schema instanceof z.ZodString) type = "string";
    else if (schema instanceof z.ZodNumber) type = "number";
    else if (schema instanceof z.ZodBoolean) type = "boolean";
    else if (schema instanceof z.ZodArray) type = "array";
    else if (schema instanceof z.ZodObject) type = "object";
    else if (schema instanceof z.ZodEnum) {
      const options = (schema as unknown as { options: string[] }).options;
      type = `enum(${options.join("|")})`;
    }

    return {
      type,
      required,
      default: defaultValue,
    };
  }
}
