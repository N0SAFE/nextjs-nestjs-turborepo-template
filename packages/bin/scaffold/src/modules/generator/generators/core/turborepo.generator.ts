/**
 * Turborepo Generator
 *
 * Sets up Turborepo for monorepo build orchestration.
 * Configures pipelines, caching, and remote caching.
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
export class TurborepoGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "turborepo",
    priority: 10,
    version: "1.0.0",
    description: "Turborepo monorepo build orchestration",
    contributesTo: ["turbo.json", "package.json"],
    dependsOn: [],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    return [
      this.file("turbo.json", this.getTurboConfig(context), {
        mergeStrategy: "json-merge-deep",
        priority: 10,
      }),
      this.file(".turbo/config.json", this.getTurboLocalConfig(), {
        mergeStrategy: "replace",
        priority: 10,
      }),
    ];
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    return [
      {
        name: "turbo",
        version: "^2.3.3",
        type: "dev",
        target: "root",
        pluginId: "turborepo",
      },
    ];
  }

  protected override getScripts(_context: GeneratorContext): ScriptSpec[] {
    return [
      {
        name: "build",
        command: "turbo build",
        target: "root",
        description: "Build all packages and apps",
        pluginId: "turborepo",
      },
      {
        name: "dev",
        command: "turbo dev",
        target: "root",
        description: "Start development servers",
        pluginId: "turborepo",
      },
      {
        name: "clean",
        command: "turbo clean && rm -rf node_modules",
        target: "root",
        description: "Clean all build artifacts and caches",
        pluginId: "turborepo",
      },
    ];
  }

  private getTurboConfig(context: GeneratorContext): string {
    const config = {
      $schema: "https://turbo.build/schema.json",
      ui: "tui",
      globalDependencies: ["**/.env.*local"],
      tasks: {
        build: {
          dependsOn: ["^build"],
          outputs: ["dist/**", ".next/**", "!.next/cache/**"],
        },
        dev: {
          cache: false,
          persistent: true,
        },
        lint: {
          dependsOn: ["^build"],
          outputs: [],
        },
        "type-check": {
          dependsOn: ["^build"],
          outputs: [],
        },
        test: {
          dependsOn: ["build"],
          outputs: ["coverage/**"],
        },
        "test:coverage": {
          dependsOn: ["build"],
          outputs: ["coverage/**"],
        },
        clean: {
          cache: false,
        },
      },
    };

    // Add format task if prettier is enabled
    if (this.hasPlugin(context, "prettier")) {
      (config.tasks as Record<string, unknown>)["format"] = {
        outputs: [],
        cache: false,
      };
    }

    return JSON.stringify(config, null, 2);
  }

  private getTurboLocalConfig(): string {
    return JSON.stringify(
      {
        experimentalUI: true,
      },
      null,
      2,
    );
  }
}
