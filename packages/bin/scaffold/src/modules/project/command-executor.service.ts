/**
 * Command Executor Service
 *
 * Executes shell commands with proper error handling and output capture.
 */
import { Injectable } from "@nestjs/common";
import { execa, type Options as ExecaOptions } from "execa";
import { CommandExecutionError } from "../../types/errors.types";

export interface ExecuteOptions {
  /** Working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Suppress output */
  silent?: boolean;
  /** Stream output */
  stream?: boolean;
  /** Shell mode */
  shell?: boolean;
}

export interface ExecuteResult {
  /** Exit code */
  exitCode: number;
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Whether command succeeded */
  success: boolean;
}

@Injectable()
export class CommandExecutorService {
  /**
   * Run a command and return output
   */
  async run(
    command: string,
    args: string[] = [],
    options: ExecuteOptions = {},
  ): Promise<string> {
    const result = await this.execute(command, args, options);

    if (!result.success) {
      throw new CommandExecutionError(
        `${command} ${args.join(" ")}`,
        result.exitCode,
        result.stderr || result.stdout,
      );
    }

    return result.stdout;
  }

  /**
   * Run a command and return full result
   */
  async execute(
    command: string,
    args: string[] = [],
    options: ExecuteOptions = {},
  ): Promise<ExecuteResult> {
    const execaOptions = {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      timeout: options.timeout,
      shell: options.shell,
      reject: false,
      ...(options.stream && !options.silent
        ? { stdout: "inherit" as const, stderr: "inherit" as const }
        : {}),
    } satisfies ExecaOptions;

    try {
      const result = await execa(command, args, execaOptions);

      return {
        exitCode: result.exitCode ?? 0,
        stdout: typeof result.stdout === "string" ? result.stdout : "",
        stderr: typeof result.stderr === "string" ? result.stderr : "",
        success: result.exitCode === 0,
      };
    } catch (error) {
      // Handle command not found or other execution errors
      const message = error instanceof Error ? error.message : String(error);
      return {
        exitCode: 1,
        stdout: "",
        stderr: message,
        success: false,
      };
    }
  }

  /**
   * Run a command in the background
   */
  spawn(
    command: string,
    args: string[] = [],
    options: ExecuteOptions = {},
  ): ReturnType<typeof execa> {
    return execa(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      shell: options.shell,
      detached: true,
      stdio: options.silent ? "ignore" : "pipe",
    });
  }

  /**
   * Check if a command exists
   */
  async exists(command: string): Promise<boolean> {
    const result = await this.execute("which", [command], { silent: true });
    return result.success;
  }

  /**
   * Run multiple commands in sequence
   */
  async sequence(
    commands: Array<{ command: string; args?: string[]; options?: ExecuteOptions }>,
    options: { stopOnError?: boolean } = {},
  ): Promise<ExecuteResult[]> {
    const results: ExecuteResult[] = [];

    for (const cmd of commands) {
      const result = await this.execute(
        cmd.command,
        cmd.args ?? [],
        cmd.options ?? {},
      );
      results.push(result);

      if (!result.success && options.stopOnError !== false) {
        break;
      }
    }

    return results;
  }

  /**
   * Run multiple commands in parallel
   */
  async parallel(
    commands: Array<{ command: string; args?: string[]; options?: ExecuteOptions }>,
  ): Promise<ExecuteResult[]> {
    const promises = commands.map((cmd) =>
      this.execute(cmd.command, cmd.args ?? [], cmd.options ?? {}),
    );

    return Promise.all(promises);
  }

  /**
   * Execute a shell script
   */
  async shell(script: string, options: ExecuteOptions = {}): Promise<string> {
    return this.run("sh", ["-c", script], { ...options, shell: true });
  }

  /**
   * Pipe commands together
   */
  async pipe(
    commands: Array<{ command: string; args?: string[] }>,
    options: ExecuteOptions = {},
  ): Promise<string> {
    if (commands.length === 0) return "";
    if (commands.length === 1) {
      return this.run(commands[0]!.command, commands[0]!.args ?? [], options);
    }

    // Build pipe command
    const pipeCmd = commands
      .map((cmd) => {
        const args = cmd.args?.join(" ") ?? "";
        return `${cmd.command}${args ? ` ${args}` : ""}`;
      })
      .join(" | ");

    return this.shell(pipeCmd, options);
  }

  /**
   * Get environment info
   */
  async getEnvironmentInfo(): Promise<{
    node: string | null;
    npm: string | null;
    yarn: string | null;
    pnpm: string | null;
    bun: string | null;
    git: string | null;
    docker: string | null;
  }> {
    const [node, npm, yarn, pnpm, bun, git, docker] = await Promise.all([
      this.getVersion("node"),
      this.getVersion("npm"),
      this.getVersion("yarn"),
      this.getVersion("pnpm"),
      this.getVersion("bun"),
      this.getVersion("git"),
      this.getVersion("docker"),
    ]);

    return { node, npm, yarn, pnpm, bun, git, docker };
  }

  /**
   * Get version of a command
   */
  private async getVersion(command: string): Promise<string | null> {
    try {
      const result = await this.execute(command, ["--version"], { silent: true });
      if (result.success) {
        // Extract version number
        const match = result.stdout.match(/(\d+\.\d+\.\d+)/);
        return match ? match[1]! : result.stdout.trim();
      }
      return null;
    } catch {
      return null;
    }
  }
}
