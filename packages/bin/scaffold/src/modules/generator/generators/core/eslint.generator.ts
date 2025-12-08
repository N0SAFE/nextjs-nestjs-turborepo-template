/**
 * ESLint Generator
 *
 * Sets up ESLint with flat config for TypeScript projects.
 * Supports NestJS and Next.js specific rules.
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
export class ESLintGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "eslint",
    priority: 5,
    version: "1.0.0",
    description: "ESLint configuration with TypeScript support",
    contributesTo: ["eslint.config.ts", "package.json"],
    dependsOn: ["tsconfig.json"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];

    // Root eslint.config.ts
    files.push(
      this.file("eslint.config.ts", this.getRootEslintConfig(context), {
        mergeStrategy: "replace",
        priority: 5,
      }),
    );

    // .eslintignore equivalent patterns added via config
    return files;
  }

  protected override getDependencies(context: GeneratorContext): DependencySpec[] {
    const deps: DependencySpec[] = [
      {
        name: "eslint",
        version: "^9.16.0",
        type: "dev",
        target: "root",
        pluginId: "eslint",
      },
      {
        name: "@typescript-eslint/parser",
        version: "^8.17.0",
        type: "dev",
        target: "root",
        pluginId: "eslint",
      },
      {
        name: "@typescript-eslint/eslint-plugin",
        version: "^8.17.0",
        type: "dev",
        target: "root",
        pluginId: "eslint",
      },
      {
        name: "eslint-config-prettier",
        version: "^9.1.0",
        type: "dev",
        target: "root",
        pluginId: "eslint",
      },
    ];

    // Add Next.js ESLint if enabled
    if (this.hasPlugin(context, "nextjs")) {
      deps.push({
        name: "@next/eslint-plugin-next",
        version: "^15.1.0",
        type: "dev",
        target: "root",
        pluginId: "eslint",
      });
    }

    return deps;
  }

  protected override getScripts(_context: GeneratorContext): ScriptSpec[] {
    return [
      {
        name: "lint",
        command: "turbo lint",
        target: "root",
        description: "Run ESLint across all packages",
        pluginId: "eslint",
      },
      {
        name: "lint:fix",
        command: "turbo lint -- --fix",
        target: "root",
        description: "Run ESLint with auto-fix",
        pluginId: "eslint",
      },
    ];
  }

  private getRootEslintConfig(context: GeneratorContext): string {
    const hasNext = this.hasPlugin(context, "nextjs");
    
    const imports = [
      `import eslint from "@eslint/js";`,
      `import tseslint from "typescript-eslint";`,
      `import prettier from "eslint-config-prettier";`,
    ];

    if (hasNext) {
      imports.push(`import next from "@next/eslint-plugin-next";`);
    }

    const configs = [
      `  eslint.configs.recommended,`,
      `  ...tseslint.configs.recommendedTypeChecked,`,
      `  prettier,`,
    ];

    return `${imports.join("\n")}

export default tseslint.config(
${configs.join("\n")}
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/*.js",
      "**/*.mjs",
      "**/*.cjs",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
);
`;
  }
}
