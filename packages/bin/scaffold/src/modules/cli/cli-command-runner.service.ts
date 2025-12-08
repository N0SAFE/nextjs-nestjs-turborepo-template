/**
 * CLI Command Runner Service
 *
 * Executes CLI commands for scaffolding tools like shadcn, nestjs, nextjs, etc.
 * Handles both interactive and non-interactive command execution.
 */

import { Injectable, Logger } from "@nestjs/common";
import { spawn, spawnSync, execSync, type SpawnOptions } from "node:child_process";
import * as path from "node:path";
import * as readline from "node:readline";
import type {
  CLICommandSpec,
  CLICommandResult,
  CLICommandType,
  GuardSpec,
} from "../../types/generator.types";
import { GuardService, type GuardContext } from "../guard/guard.service";

@Injectable()
export class CLICommandRunnerService {
  private readonly logger = new Logger(CLICommandRunnerService.name);

  constructor(private readonly guardService: GuardService) {}

  /**
   * Run a CLI command
   */
  async runCommand(
    command: CLICommandSpec,
    context: CommandRunnerContext
  ): Promise<CLICommandResult> {
    const startTime = Date.now();

    // Resolve project path from context (support both cwd and projectPath)
    const projectPath = context.cwd || context.projectPath || process.cwd();
    const packageManager = context.packageManager || "bun";
    const enabledPlugins = context.enabledPlugins || [];
    const verbose = context.verbose ?? false;

    // Run guards if specified
    if (command.guards && command.guards.length > 0) {
      const guardContext: GuardContext = {
        projectPath,
        enabledPlugins,
        packageManager,
      };

      const guardResult = await this.guardService.runGuards(command.guards, guardContext);

      if (!guardResult.passed && guardResult.hasBlocking) {
        return {
          command,
          success: false,
          exitCode: -1,
          stdout: "",
          stderr: `Guard check failed: ${guardResult.summary}`,
          duration: Date.now() - startTime,
          error: "Pre-command guards failed",
        };
      }
    }

    const cwd = command.cwd
      ? path.resolve(projectPath, command.cwd)
      : projectPath;

    const fullCommand = this.buildCommandString(command);
    this.logger.log(`Executing: ${fullCommand}`);
    this.logger.debug(`Working directory: ${cwd}`);

    try {
      if (command.interactive && command.answers) {
        return await this.runInteractiveCommand(command, cwd, startTime);
      } else {
        return await this.runNonInteractiveCommand(command, cwd, startTime, { ...context, verbose });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        command,
        success: false,
        exitCode: -1,
        stdout: "",
        stderr: error instanceof Error ? error.message : String(error),
        duration,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Run multiple commands in sequence
   */
  async runCommands(
    commands: CLICommandSpec[],
    context: CommandRunnerContext
  ): Promise<CLICommandResult[]> {
    const results: CLICommandResult[] = [];

    // Sort by priority
    const sortedCommands = [...commands].sort(
      (a, b) => (a.priority ?? 100) - (b.priority ?? 100)
    );

    for (const command of sortedCommands) {
      const result = await this.runCommand(command, context);
      results.push(result);

      if (!result.success && command.critical) {
        this.logger.error(
          `Critical command failed: ${command.command} ${command.subcommand || ""}`
        );
        break;
      }
    }

    return results;
  }

  /**
   * Run non-interactive command
   */
  private async runNonInteractiveCommand(
    command: CLICommandSpec,
    cwd: string,
    startTime: number,
    context: CommandRunnerContext
  ): Promise<CLICommandResult> {
    return new Promise((resolve) => {
      const args = this.buildArgs(command);
      const env = { ...process.env, ...command.env };

      const spawnOptions: SpawnOptions = {
        cwd,
        env,
        shell: true,
        timeout: command.timeout ?? 300000, // 5 min default
      };

      const child = spawn(command.command, args, spawnOptions);

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (data) => {
        const chunk = data.toString();
        stdout += chunk;
        if (context.verbose) {
          process.stdout.write(chunk);
        }
      });

      child.stderr?.on("data", (data) => {
        const chunk = data.toString();
        stderr += chunk;
        if (context.verbose) {
          process.stderr.write(chunk);
        }
      });

      child.on("close", (code) => {
        const duration = Date.now() - startTime;
        resolve({
          command,
          success: code === 0,
          exitCode: code ?? -1,
          stdout,
          stderr,
          duration,
          error: code !== 0 ? `Command exited with code ${code}` : undefined,
        });
      });

      child.on("error", (error) => {
        const duration = Date.now() - startTime;
        resolve({
          command,
          success: false,
          exitCode: -1,
          stdout,
          stderr: error.message,
          duration,
          error: error.message,
        });
      });
    });
  }

  /**
   * Run interactive command with pre-defined answers
   */
  private async runInteractiveCommand(
    command: CLICommandSpec,
    cwd: string,
    startTime: number
  ): Promise<CLICommandResult> {
    return new Promise((resolve) => {
      const args = this.buildArgs(command);
      const env = { ...process.env, ...command.env };

      const child = spawn(command.command, args, {
        cwd,
        env,
        shell: true,
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let answerIndex = 0;
      const answers = command.answers || [];

      child.stdout?.on("data", (data) => {
        const chunk = data.toString();
        stdout += chunk;

        // Check if we need to provide an answer
        if (answerIndex < answers.length && chunk.includes("?")) {
          setTimeout(() => {
            child.stdin?.write(answers[answerIndex] + "\n");
            answerIndex++;
          }, 100);
        }
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        const duration = Date.now() - startTime;
        resolve({
          command,
          success: code === 0,
          exitCode: code ?? -1,
          stdout,
          stderr,
          duration,
          error: code !== 0 ? `Command exited with code ${code}` : undefined,
        });
      });

      child.on("error", (error) => {
        const duration = Date.now() - startTime;
        resolve({
          command,
          success: false,
          exitCode: -1,
          stdout,
          stderr: error.message,
          duration,
          error: error.message,
        });
      });
    });
  }

  /**
   * Build command arguments array
   */
  private buildArgs(command: CLICommandSpec): string[] {
    const args: string[] = [];

    if (command.subcommand) {
      args.push(command.subcommand);
    }

    args.push(...command.args);

    return args;
  }

  /**
   * Build full command string for logging
   */
  private buildCommandString(command: CLICommandSpec): string {
    const parts = [command.command];

    if (command.subcommand) {
      parts.push(command.subcommand);
    }

    parts.push(...command.args);

    return parts.join(" ");
  }

  /**
   * Check if a command is available
   */
  isCommandAvailable(command: string): boolean {
    try {
      execSync(`which ${command}`, { encoding: "utf-8", stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create command specs for common tools
   */
  createShadcnCommand(
    action: "init" | "add",
    options: ShadcnCommandOptions
  ): CLICommandSpec {
    const args: string[] = [];

    if (action === "init") {
      args.push("--yes"); // Skip prompts
      if (options.style) args.push("--style", options.style);
      if (options.baseColor) args.push("--base-color", options.baseColor);
      if (options.cssVariables !== undefined) {
        args.push(options.cssVariables ? "--css-variables" : "--no-css-variables");
      }
    } else if (action === "add") {
      if (options.components && options.components.length > 0) {
        args.push(...options.components);
      }
      args.push("--yes"); // Skip prompts
      if (options.overwrite) args.push("--overwrite");
    }

    return {
      command: options.packageManager === "bun" ? "bunx" : "npx",
      subcommand: "shadcn@latest",
      args: [action, ...args],
      cwd: options.cwd,
      description: `Shadcn UI ${action}`,
      pluginId: options.pluginId || "shadcn",
      critical: action === "init",
      guards: [
        {
          type: "file-exists",
          name: "Check package.json",
          config: { type: "file-exists", path: "package.json" },
          blocking: true,
        },
      ],
    };
  }

  /**
   * Create NestJS CLI command
   */
  createNestJSCommand(
    action: "new" | "generate",
    options: NestJSCommandOptions
  ): CLICommandSpec {
    const args: string[] = [];

    if (action === "new") {
      args.push(options.projectName || "api");
      args.push("--package-manager", options.packageManager || "bun");
      args.push("--skip-git");
      args.push("--skip-install");
    } else if (action === "generate") {
      args.push(options.schematic || "resource");
      args.push(options.name || "");
      if (options.flat) args.push("--flat");
      if (options.spec === false) args.push("--no-spec");
    }

    return {
      command: options.packageManager === "bun" ? "bunx" : "npx",
      subcommand: "@nestjs/cli",
      args: [action, ...args],
      cwd: options.cwd,
      description: `NestJS ${action}`,
      pluginId: options.pluginId || "nestjs",
      critical: action === "new",
    };
  }

  /**
   * Create Next.js CLI command
   */
  createNextJSCommand(options: NextJSCommandOptions): CLICommandSpec {
    const args = [
      options.projectName || "web",
      "--typescript",
      "--eslint",
      "--app",
      "--src-dir",
      "--import-alias", "@/*",
    ];

    if (options.tailwind) args.push("--tailwind");
    if (options.turbopack) args.push("--turbopack");
    if (!options.installDeps) args.push("--skip-install");

    return {
      command: options.packageManager === "bun" ? "bunx" : "npx",
      subcommand: "create-next-app@latest",
      args,
      cwd: options.cwd,
      description: "Create Next.js app",
      pluginId: options.pluginId || "nextjs",
      critical: true,
      answers: ["y"], // Accept defaults
    };
  }

  /**
   * Create Prisma CLI command
   */
  createPrismaCommand(
    action: "init" | "generate" | "migrate" | "push",
    options: PrismaCommandOptions
  ): CLICommandSpec {
    const args: string[] = [];

    if (action === "init") {
      args.push("--datasource-provider", options.provider || "postgresql");
    } else if (action === "migrate") {
      args.push("dev");
      if (options.name) args.push("--name", options.name);
    } else if (action === "push") {
      args.push("db", "push");
    }

    return {
      command: options.packageManager === "bun" ? "bunx" : "npx",
      subcommand: "prisma",
      args: [action, ...args],
      cwd: options.cwd,
      description: `Prisma ${action}`,
      pluginId: options.pluginId || "prisma",
      critical: action === "init" || action === "generate",
    };
  }

  /**
   * Create Drizzle Kit command
   */
  createDrizzleCommand(
    action: "generate" | "push" | "migrate",
    options: DrizzleCommandOptions
  ): CLICommandSpec {
    const args: string[] = [];

    if (action === "generate") {
      args.push("--config", options.config || "drizzle.config.ts");
    } else if (action === "push") {
      args.push("--config", options.config || "drizzle.config.ts");
    } else if (action === "migrate") {
      args.push("--config", options.config || "drizzle.config.ts");
    }

    return {
      command: options.packageManager === "bun" ? "bunx" : "npx",
      subcommand: "drizzle-kit",
      args: [action, ...args],
      cwd: options.cwd,
      description: `Drizzle Kit ${action}`,
      pluginId: options.pluginId || "drizzle",
      critical: false,
    };
  }

  /**
   * Create package install command
   */
  createInstallCommand(options: InstallCommandOptions): CLICommandSpec {
    const pm = options.packageManager || "bun";
    let command: string;
    const args: string[] = [];

    switch (pm) {
      case "bun":
        command = "bun";
        args.push("install");
        break;
      case "pnpm":
        command = "pnpm";
        args.push("install");
        break;
      case "yarn":
        command = "yarn";
        break;
      default:
        command = "npm";
        args.push("install");
    }

    if (options.frozen) {
      switch (pm) {
        case "bun":
          args.push("--frozen-lockfile");
          break;
        case "pnpm":
          args.push("--frozen-lockfile");
          break;
        case "yarn":
          args.push("--frozen-lockfile");
          break;
        default:
          args.push("--ci");
      }
    }

    return {
      command,
      args,
      cwd: options.cwd,
      description: "Install dependencies",
      pluginId: options.pluginId || "core",
      critical: true,
    };
  }

  /**
   * Create git init command
   */
  createGitInitCommand(options: GitCommandOptions): CLICommandSpec {
    return {
      command: "git",
      subcommand: "init",
      args: options.branch ? ["-b", options.branch] : [],
      cwd: options.cwd,
      description: "Initialize git repository",
      pluginId: options.pluginId || "git",
      critical: false,
    };
  }
}

/**
 * Context for command execution
 */
export interface CommandRunnerContext {
  /** Project root path (alias: cwd) */
  projectPath?: string;
  /** Working directory (alias: projectPath) */
  cwd?: string;
  /** Environment variables */
  env?: NodeJS.ProcessEnv;
  /** Enabled plugin IDs */
  enabledPlugins?: string[];
  /** Package manager */
  packageManager?: "bun" | "npm" | "pnpm" | "yarn";
  /** Verbose output */
  verbose?: boolean;
  /** Dry run mode */
  dryRun?: boolean;
}

/**
 * Shadcn command options
 */
export interface ShadcnCommandOptions {
  packageManager?: "bun" | "npm" | "pnpm" | "yarn";
  cwd?: string;
  pluginId?: string;
  // Init options
  style?: "default" | "new-york";
  baseColor?: string;
  cssVariables?: boolean;
  // Add options
  components?: string[];
  overwrite?: boolean;
}

/**
 * NestJS command options
 */
export interface NestJSCommandOptions {
  packageManager?: "bun" | "npm" | "pnpm" | "yarn";
  cwd?: string;
  pluginId?: string;
  // New options
  projectName?: string;
  // Generate options
  schematic?: "resource" | "controller" | "service" | "module" | "guard" | "pipe";
  name?: string;
  flat?: boolean;
  spec?: boolean;
}

/**
 * Next.js command options
 */
export interface NextJSCommandOptions {
  packageManager?: "bun" | "npm" | "pnpm" | "yarn";
  cwd?: string;
  pluginId?: string;
  projectName?: string;
  tailwind?: boolean;
  turbopack?: boolean;
  installDeps?: boolean;
}

/**
 * Prisma command options
 */
export interface PrismaCommandOptions {
  packageManager?: "bun" | "npm" | "pnpm" | "yarn";
  cwd?: string;
  pluginId?: string;
  provider?: "postgresql" | "mysql" | "sqlite" | "sqlserver" | "mongodb";
  name?: string;
}

/**
 * Drizzle command options
 */
export interface DrizzleCommandOptions {
  packageManager?: "bun" | "npm" | "pnpm" | "yarn";
  cwd?: string;
  pluginId?: string;
  config?: string;
}

/**
 * Install command options
 */
export interface InstallCommandOptions {
  packageManager?: "bun" | "npm" | "pnpm" | "yarn";
  cwd?: string;
  pluginId?: string;
  frozen?: boolean;
}

/**
 * Git command options
 */
export interface GitCommandOptions {
  cwd?: string;
  pluginId?: string;
  branch?: string;
}
