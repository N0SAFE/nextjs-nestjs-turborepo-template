/**
 * Guard Service
 *
 * Handles pre-generation, file-level, and post-generation guard checks.
 * Guards ensure preconditions are met before scaffolding operations.
 */

import { Injectable, Logger } from "@nestjs/common";
import { execSync, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import type {
  GuardSpec,
  GuardResult,
  GuardConfig,
  DependencyGuardConfig,
  FileGuardConfig,
  EnvGuardConfig,
  CommandGuardConfig,
  VersionGuardConfig,
  PluginGuardConfig,
  CustomGuardConfig,
} from "../../types/generator.types";

@Injectable()
export class GuardService {
  private readonly logger = new Logger(GuardService.name);

  /**
   * Run all guards and collect results
   */
  async runGuards(
    guards: GuardSpec[],
    context: GuardContext
  ): Promise<GuardCheckResult> {
    const results: GuardResult[] = [];
    let allPassed = true;
    let hasBlocking = false;

    for (const guard of guards) {
      const result = await this.runGuard(guard, context);
      results.push(result);

      if (!result.passed) {
        if (guard.blocking !== false && result.severity === "error") {
          hasBlocking = true;
          allPassed = false;
          this.logger.error(`Guard failed: ${guard.name} - ${result.message}`);
        } else if (result.severity === "warning") {
          this.logger.warn(`Guard warning: ${guard.name} - ${result.message}`);
        } else {
          this.logger.debug(`Guard info: ${guard.name} - ${result.message}`);
        }
      } else {
        this.logger.debug(`Guard passed: ${guard.name}`);
      }
    }

    return {
      passed: allPassed,
      hasBlocking,
      results,
      summary: this.generateSummary(results),
    };
  }

  /**
   * Run a single guard check
   */
  async runGuard(guard: GuardSpec, context: GuardContext): Promise<GuardResult> {
    try {
      switch (guard.type) {
        case "dependency":
          return this.checkDependency(guard.config as DependencyGuardConfig, context);
        case "file-exists":
        case "file-missing":
          return this.checkFile(guard.config as FileGuardConfig, context);
        case "env-var":
          return this.checkEnvVar(guard.config as EnvGuardConfig);
        case "command":
          return this.checkCommand(guard.config as CommandGuardConfig);
        case "version":
          return this.checkVersion(guard.config as VersionGuardConfig);
        case "plugin":
          return this.checkPlugin(guard.config as PluginGuardConfig, context);
        case "custom":
          return this.runCustomGuard(guard.config as CustomGuardConfig, context);
        default:
          return {
            passed: false,
            message: `Unknown guard type: ${guard.type}`,
            severity: "error",
          };
      }
    } catch (error) {
      return {
        passed: false,
        message: `Guard error: ${error instanceof Error ? error.message : String(error)}`,
        severity: "error",
      };
    }
  }

  /**
   * Check if a dependency is available
   */
  private checkDependency(
    config: DependencyGuardConfig,
    context: GuardContext
  ): GuardResult {
    const packageJsonPath = path.join(context.projectPath, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
      return {
        passed: false,
        message: `package.json not found at ${packageJsonPath}`,
        severity: "error",
        suggestion: "Initialize the project with a package.json first",
      };
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const deps = config.dev
        ? packageJson.devDependencies || {}
        : packageJson.dependencies || {};

      const version = deps[config.package];

      if (!version) {
        return {
          passed: false,
          message: `Package "${config.package}" is not installed`,
          severity: "error",
          suggestion: `Install with: ${context.packageManager || "bun"} add ${config.dev ? "-D " : ""}${config.package}`,
        };
      }

      if (config.minVersion) {
        const cleanVersion = version.replace(/[\^~>=<]/g, "");
        if (!this.satisfiesVersion(cleanVersion, config.minVersion)) {
          return {
            passed: false,
            message: `Package "${config.package}" version ${version} does not satisfy minimum ${config.minVersion}`,
            severity: "warning",
            suggestion: `Update with: ${context.packageManager || "bun"} add ${config.dev ? "-D " : ""}${config.package}@${config.minVersion}`,
          };
        }
      }

      return { passed: true, severity: "info" };
    } catch (error) {
      return {
        passed: false,
        message: `Failed to read package.json: ${error instanceof Error ? error.message : String(error)}`,
        severity: "error",
      };
    }
  }

  /**
   * Check file existence/absence
   */
  private checkFile(config: FileGuardConfig, context: GuardContext): GuardResult {
    const filePath = path.join(context.projectPath, config.path);
    const exists = fs.existsSync(filePath);

    if (config.type === "file-exists") {
      if (!exists) {
        return {
          passed: false,
          message: `Required file not found: ${config.path}`,
          severity: "error",
          suggestion: `Create the file at ${config.path}`,
        };
      }

      if (config.contentPattern) {
        const content = fs.readFileSync(filePath, "utf-8");
        const pattern =
          typeof config.contentPattern === "string"
            ? new RegExp(config.contentPattern)
            : config.contentPattern;

        if (!pattern.test(content)) {
          return {
            passed: false,
            message: `File ${config.path} does not contain required pattern`,
            severity: "warning",
          };
        }
      }

      return { passed: true, severity: "info" };
    }

    // file-missing
    if (exists) {
      return {
        passed: false,
        message: `File should not exist: ${config.path}`,
        severity: "warning",
        suggestion: "Remove the file or skip this generator",
      };
    }

    return { passed: true, severity: "info" };
  }

  /**
   * Check environment variable
   */
  private checkEnvVar(config: EnvGuardConfig): GuardResult {
    const value = process.env[config.name];

    if (value === undefined) {
      return {
        passed: false,
        message: `Environment variable "${config.name}" is not set`,
        severity: "error",
        suggestion: `Set the environment variable: export ${config.name}=<value>`,
      };
    }

    if (config.value !== undefined && value !== config.value) {
      return {
        passed: false,
        message: `Environment variable "${config.name}" has value "${value}", expected "${config.value}"`,
        severity: "warning",
      };
    }

    if (config.pattern && !config.pattern.test(value)) {
      return {
        passed: false,
        message: `Environment variable "${config.name}" value does not match pattern`,
        severity: "warning",
      };
    }

    return { passed: true, severity: "info" };
  }

  /**
   * Check if a command is available
   */
  private checkCommand(config: CommandGuardConfig): GuardResult {
    try {
      const result = spawnSync(config.command, config.args || ["--version"], {
        encoding: "utf-8",
        timeout: 5000,
        shell: true,
      });

      const expectedCode = config.exitCode ?? 0;
      if (result.status !== expectedCode) {
        return {
          passed: false,
          message: `Command "${config.command}" returned exit code ${result.status}, expected ${expectedCode}`,
          severity: "error",
          suggestion: `Install ${config.command} and ensure it's in your PATH`,
        };
      }

      return { passed: true, severity: "info" };
    } catch {
      return {
        passed: false,
        message: `Command "${config.command}" is not available`,
        severity: "error",
        suggestion: `Install ${config.command} and ensure it's in your PATH`,
      };
    }
  }

  /**
   * Check tool version
   */
  private checkVersion(config: VersionGuardConfig): GuardResult {
    const versionCommands: Record<string, string[]> = {
      node: ["node", "--version"],
      bun: ["bun", "--version"],
      npm: ["npm", "--version"],
      pnpm: ["pnpm", "--version"],
      yarn: ["yarn", "--version"],
    };

    const [cmd, ...args] = versionCommands[config.tool] || [config.tool, "--version"];

    try {
      const result = execSync(`${cmd} ${args.join(" ")}`, {
        encoding: "utf-8",
        timeout: 5000,
      }).trim();

      const version = result.replace(/^v/, "");

      if (!this.satisfiesVersion(version, config.minVersion)) {
        return {
          passed: false,
          message: `${config.tool} version ${version} does not meet minimum ${config.minVersion}`,
          severity: "error",
          suggestion: `Update ${config.tool} to at least version ${config.minVersion}`,
        };
      }

      if (config.maxVersion && !this.satisfiesVersion(config.maxVersion, version)) {
        return {
          passed: false,
          message: `${config.tool} version ${version} exceeds maximum ${config.maxVersion}`,
          severity: "warning",
        };
      }

      return { passed: true, severity: "info" };
    } catch {
      return {
        passed: false,
        message: `Could not determine ${config.tool} version`,
        severity: "error",
        suggestion: `Ensure ${config.tool} is installed and in your PATH`,
      };
    }
  }

  /**
   * Check if a plugin is enabled/disabled
   */
  private checkPlugin(config: PluginGuardConfig, context: GuardContext): GuardResult {
    const isEnabled = context.enabledPlugins.includes(config.pluginId);

    if (config.mode === "enabled" && !isEnabled) {
      return {
        passed: false,
        message: `Required plugin "${config.pluginId}" is not enabled`,
        severity: "error",
        suggestion: `Enable the "${config.pluginId}" plugin in your configuration`,
      };
    }

    if (config.mode === "disabled" && isEnabled) {
      return {
        passed: false,
        message: `Plugin "${config.pluginId}" should not be enabled`,
        severity: "warning",
      };
    }

    return { passed: true, severity: "info" };
  }

  /**
   * Run custom guard function
   */
  private runCustomGuard(
    config: CustomGuardConfig,
    context: GuardContext
  ): GuardResult {
    const customGuards = context.customGuards || {};
    const guardFn = customGuards[config.fn];

    if (!guardFn) {
      return {
        passed: false,
        message: `Custom guard function "${config.fn}" not found`,
        severity: "error",
      };
    }

    try {
      return guardFn(config.args || [], context);
    } catch (error) {
      return {
        passed: false,
        message: `Custom guard "${config.fn}" threw error: ${error instanceof Error ? error.message : String(error)}`,
        severity: "error",
      };
    }
  }

  /**
   * Simple semver comparison (checks if current >= required)
   */
  private satisfiesVersion(current: string, required: string): boolean {
    const currentParts = current.split(".").map(Number);
    const requiredParts = required.split(".").map(Number);

    for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
      const curr = currentParts[i] || 0;
      const req = requiredParts[i] || 0;

      if (curr > req) return true;
      if (curr < req) return false;
    }

    return true;
  }

  /**
   * Generate summary of guard results
   */
  private generateSummary(results: GuardResult[]): string {
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed && r.severity === "error").length;
    const warnings = results.filter((r) => !r.passed && r.severity === "warning").length;

    return `Guards: ${passed} passed, ${failed} failed, ${warnings} warnings`;
  }

  /**
   * Create common guards for typical scenarios
   */
  createCommonGuards(): Record<string, GuardSpec> {
    return {
      nodeVersion: {
        type: "version",
        name: "Node.js Version Check",
        description: "Ensure Node.js 18+ is installed",
        config: { type: "version", tool: "node", minVersion: "18.0.0" },
        blocking: true,
      },
      bunInstalled: {
        type: "command",
        name: "Bun Installation Check",
        description: "Ensure Bun is installed",
        config: { type: "command", command: "bun", args: ["--version"] },
        blocking: false,
      },
      gitInstalled: {
        type: "command",
        name: "Git Installation Check",
        description: "Ensure Git is installed",
        config: { type: "command", command: "git", args: ["--version"] },
        blocking: false,
      },
      dockerInstalled: {
        type: "command",
        name: "Docker Installation Check",
        description: "Ensure Docker is installed",
        config: { type: "command", command: "docker", args: ["--version"] },
        blocking: false,
      },
    };
  }
}

/**
 * Context for guard execution
 */
export interface GuardContext {
  /** Project root path */
  projectPath: string;
  /** Enabled plugin IDs */
  enabledPlugins: string[];
  /** Package manager being used */
  packageManager?: "bun" | "npm" | "pnpm" | "yarn";
  /** Custom guard functions */
  customGuards?: Record<string, CustomGuardFn>;
  /** Environment (development, production) */
  environment?: string;
}

/**
 * Custom guard function type
 */
export type CustomGuardFn = (
  args: unknown[],
  context: GuardContext
) => GuardResult;

/**
 * Result of running all guards
 */
export interface GuardCheckResult {
  /** Whether all blocking guards passed */
  passed: boolean;
  /** Whether any blocking guard failed */
  hasBlocking: boolean;
  /** Individual guard results */
  results: GuardResult[];
  /** Human-readable summary */
  summary: string;
}
