/**
 * Logger Service
 *
 * Provides styled console logging with different levels and formatting.
 */
import { Injectable } from "@nestjs/common";
import kleur from "kleur";

export type LogLevel = "debug" | "info" | "success" | "warn" | "error";

export interface LoggerOptions {
  /** Minimum log level to display */
  level?: LogLevel;
  /** Whether to show timestamps */
  timestamps?: boolean;
  /** Whether to enable verbose output */
  verbose?: boolean;
  /** Prefix for all log messages */
  prefix?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  success: 2,
  warn: 3,
  error: 4,
};

@Injectable()
export class LoggerService {
  private options: Required<LoggerOptions> = {
    level: "info",
    timestamps: false,
    verbose: false,
    prefix: "",
  };

  /**
   * Configure logger options
   */
  configure(options: LoggerOptions): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.options.level = level;
  }

  /**
   * Enable/disable verbose mode
   */
  setVerbose(verbose: boolean): void {
    this.options.verbose = verbose;
    if (verbose) {
      this.options.level = "debug";
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      this.log(kleur.gray("⚙"), kleur.gray(message), args);
    }
  }

  /**
   * Log info message
   */
  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog("info")) {
      this.log(kleur.blue("ℹ"), message, args);
    }
  }

  /**
   * Log success message
   */
  success(message: string, ...args: unknown[]): void {
    if (this.shouldLog("success")) {
      this.log(kleur.green("✔"), kleur.green(message), args);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog("warn")) {
      this.log(kleur.yellow("⚠"), kleur.yellow(message), args);
    }
  }

  /**
   * Log error message
   */
  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog("error")) {
      this.log(kleur.red("✖"), kleur.red(message), args);
    }
  }

  /**
   * Log a blank line
   */
  newline(): void {
    console.log();
  }

  /**
   * Log a divider line
   */
  divider(char = "─", length = 50): void {
    console.log(kleur.gray(char.repeat(length)));
  }

  /**
   * Log a header
   */
  header(title: string): void {
    this.newline();
    console.log(kleur.bold().cyan(`━━━ ${title} ━━━`));
    this.newline();
  }

  /**
   * Log a step in a process
   */
  step(current: number, total: number, message: string): void {
    const progress = kleur.dim(`[${current}/${total}]`);
    console.log(`${progress} ${message}`);
  }

  /**
   * Log a bullet point
   */
  bullet(message: string, indent = 0): void {
    const padding = "  ".repeat(indent);
    console.log(`${padding}${kleur.gray("•")} ${message}`);
  }

  /**
   * Log a tree item
   */
  tree(message: string, isLast = false, indent = 0): void {
    const prefix = isLast ? "└──" : "├──";
    const padding = "│  ".repeat(indent);
    console.log(`${kleur.gray(padding)}${kleur.gray(prefix)} ${message}`);
  }

  /**
   * Log a key-value pair
   */
  keyValue(key: string, value: string | number | boolean): void {
    console.log(`  ${kleur.dim(key + ":")} ${kleur.cyan(String(value))}`);
  }

  /**
   * Log a table
   */
  table(
    headers: string[],
    rows: (string | number)[][],
    options?: { padding?: number },
  ): void {
    const padding = options?.padding ?? 2;
    const columnWidths = headers.map((header, i) =>
      Math.max(
        header.length,
        ...rows.map((row) => String(row[i] ?? "").length),
      ),
    );

    // Header
    const headerRow = headers
      .map((h, i) => h.padEnd(columnWidths[i] ?? 0))
      .join(" ".repeat(padding));
    console.log(kleur.bold(headerRow));

    // Divider
    const divider = columnWidths
      .map((w) => "─".repeat(w))
      .join("─".repeat(padding));
    console.log(kleur.gray(divider));

    // Rows
    for (const row of rows) {
      const rowStr = row
        .map((cell, i) => String(cell ?? "").padEnd(columnWidths[i] ?? 0))
        .join(" ".repeat(padding));
      console.log(rowStr);
    }
  }

  /**
   * Log JSON data with formatting
   */
  json(data: unknown, indent = 2): void {
    console.log(JSON.stringify(data, null, indent));
  }

  /**
   * Log a box with content
   */
  box(
    content: string | string[],
    options?: { title?: string; padding?: number },
  ): void {
    const lines = Array.isArray(content) ? content : [content];
    const maxWidth = Math.max(
      ...lines.map((l) => l.length),
      (options?.title?.length ?? 0) + 4,
    );
    const padding = options?.padding ?? 1;
    const paddingStr = " ".repeat(padding);

    const topBorder = options?.title
      ? `┌─ ${options.title} ${"─".repeat(maxWidth - options.title.length - 1)}┐`
      : `┌${"─".repeat(maxWidth + padding * 2)}┐`;

    console.log(kleur.gray(topBorder));

    for (const line of lines) {
      console.log(
        kleur.gray("│") +
          paddingStr +
          line.padEnd(maxWidth) +
          paddingStr +
          kleur.gray("│"),
      );
    }

    console.log(kleur.gray(`└${"─".repeat(maxWidth + padding * 2)}┘`));
  }

  /**
   * Check if a log level should be displayed
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.options.level];
  }

  /**
   * Internal log method
   */
  private log(icon: string, message: string, args: unknown[]): void {
    const parts: string[] = [];

    if (this.options.timestamps) {
      parts.push(kleur.gray(`[${new Date().toISOString()}]`));
    }

    if (this.options.prefix) {
      parts.push(kleur.dim(`[${this.options.prefix}]`));
    }

    parts.push(icon, message);

    if (args.length > 0) {
      console.log(parts.join(" "), ...args);
    } else {
      console.log(parts.join(" "));
    }
  }
}
