/**
 * Prettier Generator
 *
 * Sets up Prettier with consistent formatting rules.
 * Integrates with ESLint and other tools.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
  ScriptSpec,
} from "../../../../types/generator.types";

@Injectable()
export class PrettierGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "prettier",
    priority: 5,
    version: "1.0.0",
    description: "Prettier configuration for code formatting",
    contributesTo: [".prettierrc", ".prettierignore", "package.json"],
    dependsOn: [],
  };

  protected override getFiles(_context: GeneratorContext): FileSpec[] {
    return [
      this.file(".prettierrc", this.getPrettierConfig(), {
        mergeStrategy: "replace",
        priority: 5,
      }),
      this.file(".prettierignore", this.getPrettierIgnore(), {
        mergeStrategy: "replace",
        priority: 5,
      }),
    ];
  }

  protected override getDependencies(context: GeneratorContext): DependencySpec[] {
    const deps: DependencySpec[] = [
      {
        name: "prettier",
        version: "^3.4.2",
        type: "dev",
        target: "root",
        pluginId: "prettier",
      },
    ];

    // Add Tailwind plugin if Tailwind is enabled
    if (this.hasPlugin(context, "tailwindcss")) {
      deps.push({
        name: "prettier-plugin-tailwindcss",
        version: "^0.6.9",
        type: "dev",
        target: "root",
        pluginId: "prettier",
      });
    }

    return deps;
  }

  protected override getScripts(_context: GeneratorContext): ScriptSpec[] {
    return [
      {
        name: "format",
        command: 'prettier --write "**/*.{ts,tsx,js,jsx,json,md,css}"',
        target: "root",
        description: "Format all files with Prettier",
        pluginId: "prettier",
      },
      {
        name: "format:check",
        command: 'prettier --check "**/*.{ts,tsx,js,jsx,json,md,css}"',
        target: "root",
        description: "Check formatting without writing",
        pluginId: "prettier",
      },
    ];
  }

  private getPrettierConfig(): string {
    const config = {
      semi: true,
      singleQuote: false,
      tabWidth: 2,
      trailingComma: "all",
      printWidth: 100,
      bracketSpacing: true,
      arrowParens: "always",
      endOfLine: "lf",
      plugins: [] as string[],
    };

    return JSON.stringify(config, null, 2);
  }

  private getPrettierIgnore(): string {
    return `# Dependencies
node_modules

# Build outputs
dist
.next
.turbo
coverage

# Generated files
*.generated.*
*.d.ts

# Package manager
bun.lockb
package-lock.json
yarn.lock
pnpm-lock.yaml

# Docker
Dockerfile*

# Environment
.env*
`;
  }
}
