/**
 * Vitest Generator
 *
 * Sets up Vitest for testing with workspace support.
 * Configures coverage and watch mode.
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
export class VitestGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "vitest",
    priority: 10,
    version: "1.0.0",
    description: "Vitest testing framework with workspace support",
    contributesTo: ["vitest.config.mts", "vitest.workspace.mts", "package.json"],
    dependsOn: ["tsconfig.json"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    return [
      this.file("vitest.config.mts", this.getVitestConfig(context), {
        mergeStrategy: "replace",
        priority: 10,
      }),
      this.file("vitest.workspace.mts", this.getVitestWorkspace(context), {
        mergeStrategy: "replace",
        priority: 10,
      }),
    ];
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    return [
      {
        name: "vitest",
        version: "^2.1.8",
        type: "dev",
        target: "root",
        pluginId: "vitest",
      },
      {
        name: "@vitest/coverage-v8",
        version: "^2.1.8",
        type: "dev",
        target: "root",
        pluginId: "vitest",
      },
      {
        name: "@vitest/ui",
        version: "^2.1.8",
        type: "dev",
        target: "root",
        pluginId: "vitest",
      },
    ];
  }

  protected override getScripts(_context: GeneratorContext): ScriptSpec[] {
    return [
      {
        name: "test",
        command: "vitest run",
        target: "root",
        description: "Run all tests",
        pluginId: "vitest",
      },
      {
        name: "test:watch",
        command: "vitest",
        target: "root",
        description: "Run tests in watch mode",
        pluginId: "vitest",
      },
      {
        name: "test:ui",
        command: "vitest --ui",
        target: "root",
        description: "Run tests with UI",
        pluginId: "vitest",
      },
      {
        name: "test:coverage",
        command: "vitest run --coverage",
        target: "root",
        description: "Run tests with coverage report",
        pluginId: "vitest",
      },
    ];
  }

  private getVitestConfig(context: GeneratorContext): string {
    const hasReact = this.hasPlugin(context, "nextjs") || this.hasPlugin(context, "react");

    const imports = [`import { defineConfig } from "vitest/config";`];
    const plugins: string[] = [];

    if (hasReact) {
      imports.push(`import react from "@vitejs/plugin-react";`);
      plugins.push("react()");
    }

    const pluginsStr = plugins.length > 0 ? `plugins: [${plugins.join(", ")}],` : "";

    return `${imports.join("\n")}

export default defineConfig({
  ${pluginsStr}
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.turbo/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/vitest.*.ts",
      ],
    },
    passWithNoTests: true,
  },
});
`;
  }

  private getVitestWorkspace(context: GeneratorContext): string {
    const workspaces: string[] = [];

    if (this.hasPlugin(context, "nextjs")) {
      workspaces.push('"apps/web"');
    }
    if (this.hasPlugin(context, "nestjs")) {
      workspaces.push('"apps/api"');
    }
    workspaces.push('"packages/*"');

    return `import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  ${workspaces.join(",\n  ")},
]);
`;
  }
}
