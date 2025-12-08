/**
 * TypeScript Generator
 *
 * Sets up TypeScript configuration for the monorepo.
 * Contributes to tsconfig.json files at root and app levels.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
  FileContribution,
} from "../../../../types/generator.types";

@Injectable()
export class TypeScriptGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "typescript",
    priority: 0, // Core - runs first
    version: "1.0.0",
    description: "TypeScript configuration for monorepo",
    contributesTo: [
      "tsconfig.json",
      "tsconfig.base.json",
      "apps/*/tsconfig.json",
      "packages/*/tsconfig.json",
    ],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];

    // Root tsconfig.base.json - shared compiler options
    files.push(
      this.file(
        "tsconfig.base.json",
        JSON.stringify(this.getRootTsConfigBase(context), null, 2),
        { mergeStrategy: "json-merge", priority: 0 },
      ),
    );

    // Root tsconfig.json - references to all projects
    files.push(
      this.file(
        "tsconfig.json",
        JSON.stringify(this.getRootTsConfig(context), null, 2),
        { mergeStrategy: "json-merge", priority: 0 },
      ),
    );

    return files;
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    return [
      {
        name: "typescript",
        version: "^5.7.0",
        type: "dev",
        target: "root",
        pluginId: "typescript",
      },
      {
        name: "@types/node",
        version: "^22.10.0",
        type: "dev",
        target: "root",
        pluginId: "typescript",
      },
    ];
  }

  /**
   * Get contributions for multi-plugin merging
   */
  getContributions(context: GeneratorContext): FileContribution[] {
    return [
      {
        pluginId: "typescript",
        path: "tsconfig.base.json",
        content: JSON.stringify(this.getRootTsConfigBase(context), null, 2),
        mergeStrategy: "json-merge",
        priority: 0,
      },
      {
        pluginId: "typescript",
        path: "tsconfig.json",
        content: JSON.stringify(this.getRootTsConfig(context), null, 2),
        mergeStrategy: "json-merge",
        priority: 0,
      },
    ];
  }

  private getRootTsConfigBase(context: GeneratorContext): object {
    const config = context.projectConfig;
    
    return {
      "$schema": "https://json.schemastore.org/tsconfig",
      compilerOptions: {
        // Language settings
        target: "ES2022",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        module: "ESNext",
        moduleResolution: "bundler",
        moduleDetection: "force",
        
        // Strict type checking
        strict: true,
        noUncheckedIndexedAccess: true,
        noImplicitOverride: true,
        
        // Module interop
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        isolatedModules: true,
        verbatimModuleSyntax: true,
        
        // Output settings
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        
        // Resolution
        resolveJsonModule: true,
        
        // Paths (can be extended by plugins)
        baseUrl: ".",
        paths: {
          [`@${config.name}/*`]: ["packages/*/src"],
        },
        
        // Skip lib checks for faster builds
        skipLibCheck: true,
      },
    };
  }

  private getRootTsConfig(context: GeneratorContext): object {
    const references: { path: string }[] = [];

    // Add references based on enabled plugins
    if (this.hasPlugin(context, "nestjs")) {
      references.push({ path: "apps/api" });
    }
    if (this.hasPlugin(context, "nextjs")) {
      references.push({ path: "apps/web" });
    }
    if (this.hasPlugin(context, "fumadocs")) {
      references.push({ path: "apps/doc" });
    }

    // Add package references
    references.push({ path: "packages/types" });
    
    if (this.hasPlugin(context, "orpc")) {
      references.push({ path: "packages/contracts/api" });
    }
    if (this.hasPlugin(context, "shadcn-ui")) {
      references.push({ path: "packages/ui/base" });
    }

    return {
      extends: "./tsconfig.base.json",
      compilerOptions: {
        composite: true,
        noEmit: true,
      },
      include: [],
      references,
    };
  }
}
