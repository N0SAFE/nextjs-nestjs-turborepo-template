/**
 * Bun Runtime Generator
 *
 * Sets up Bun as the package manager and runtime for the monorepo.
 * Creates bunfig.toml with optimal settings for monorepo development.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
  FileContribution,
  ScriptSpec,
} from "../../../../types/generator.types";

@Injectable()
export class BunRuntimeGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "bun-runtime",
    priority: 1, // Core - runs very early, after base
    version: "1.0.0",
    description: "Bun runtime and package manager configuration",
    contributesTo: ["bunfig.toml", "package.json"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];

    // Root bunfig.toml - Bun configuration
    files.push(
      this.file("bunfig.toml", this.getBunfigContent(context), {
        priority: 0,
      }),
    );

    return files;
  }

  protected override getDependencies(
    _context: GeneratorContext,
  ): DependencySpec[] {
    return [
      // Bun types for TypeScript
      {
        name: "@types/bun",
        version: "^1.1.0",
        type: "dev",
        target: "root",
        pluginId: "bun-runtime",
      },
    ];
  }

  protected override getScripts(_context: GeneratorContext): ScriptSpec[] {
    return [
      // Add bun-specific scripts to root package.json
      {
        name: "clean",
        command: 'find . -name "node_modules" -type d -prune -exec rm -rf {} + && find . -name ".turbo" -type d -prune -exec rm -rf {} + && find . -name "dist" -type d -prune -exec rm -rf {} +',
        target: "root",
        pluginId: "bun-runtime",
      },
      {
        name: "clean:modules",
        command: 'find . -name "node_modules" -type d -prune -exec rm -rf {} +',
        target: "root",
        pluginId: "bun-runtime",
      },
      {
        name: "reinstall",
        command: "bun run clean:modules && bun install",
        target: "root",
        pluginId: "bun-runtime",
      },
    ];
  }

  /**
   * Get contributions for multi-plugin merging
   */
  getContributions(context: GeneratorContext): FileContribution[] {
    return [
      {
        pluginId: "bun-runtime",
        path: "bunfig.toml",
        content: this.getBunfigContent(context),
        mergeStrategy: "replace",
        priority: 0,
      },
    ];
  }

  private getBunfigContent(context: GeneratorContext): string {
    const config = context.projectConfig;
    const lines: string[] = [];

    // Header comment
    lines.push("# Bun configuration for " + config.name);
    lines.push("# https://bun.sh/docs/runtime/bunfig");
    lines.push("");

    // Install settings
    lines.push("[install]");
    lines.push("# Automatically install peer dependencies");
    lines.push("peer = true");
    lines.push("");

    // Lockfile settings
    lines.push("[install.lockfile]");
    lines.push("# Save lockfile to disk");
    lines.push("save = true");
    lines.push("# Print lockfile to stdout (useful for debugging)");
    lines.push("print = false");
    lines.push("");

    // Cache settings for faster installs
    lines.push("[install.cache]");
    lines.push("# Use global cache");
    lines.push("dir = \"~/.bun/install/cache\"");
    lines.push("# Disable cache (for clean installs)");
    lines.push("disable = false");
    lines.push("");

    // Test settings
    if (this.hasPlugin(context, "vitest")) {
      lines.push("# Note: This project uses Vitest for testing");
      lines.push("# Run tests with: bun run test");
      lines.push("");
    } else {
      lines.push("[test]");
      lines.push("# Test configuration");
      lines.push("preload = []");
      lines.push("");
    }

    // Development settings
    lines.push("[run]");
    lines.push("# Shell to use for bun run scripts");
    lines.push('shell = "bash"');
    lines.push("");

    // Telemetry (disabled by default for privacy)
    lines.push("[telemetry]");
    lines.push("# Disable telemetry");
    lines.push("enabled = false");

    return lines.join("\n");
  }
}
