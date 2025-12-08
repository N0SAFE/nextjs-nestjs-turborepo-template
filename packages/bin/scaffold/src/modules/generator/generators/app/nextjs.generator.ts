/**
 * Next.js Generator
 *
 * Sets up a Next.js application with App Router, TypeScript, and Tailwind.
 * Configures declarative routing and ORPC client integration.
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
export class NextJSGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "nextjs",
    priority: 20,
    version: "1.0.0",
    description: "Next.js frontend application with App Router",
    contributesTo: ["apps/web/**", "package.json"],
    dependsOn: ["tsconfig.json"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];
    const { projectConfig } = context;

    // Next.js config
    files.push(
      this.file("apps/web/next.config.ts", this.getNextConfig(context), {
        mergeStrategy: "replace",
        priority: 20,
      }),
    );

    // Package.json
    files.push(
      this.file("apps/web/package.json", this.getWebPackageJson(projectConfig.name), {
        mergeStrategy: "json-merge-deep",
        priority: 20,
      }),
    );

    // TSConfig
    files.push(
      this.file("apps/web/tsconfig.json", this.getWebTsConfig(projectConfig.name), {
        mergeStrategy: "json-merge-deep",
        priority: 20,
      }),
    );

    // Root layout
    files.push(
      this.file("apps/web/src/app/layout.tsx", this.getRootLayout(context), {
        mergeStrategy: "replace",
        priority: 20,
      }),
    );

    // Root page
    files.push(
      this.file("apps/web/src/app/page.tsx", this.getRootPage(), {
        mergeStrategy: "replace",
        priority: 20,
      }),
    );

    // Globals CSS
    files.push(
      this.file("apps/web/src/app/globals.css", this.getGlobalsCss(context), {
        mergeStrategy: "replace",
        priority: 20,
      }),
    );

    // PostCSS config
    files.push(
      this.file("apps/web/postcss.config.mjs", this.getPostCssConfig(), {
        mergeStrategy: "replace",
        priority: 20,
      }),
    );

    // Tailwind config (if enabled)
    if (this.hasPlugin(context, "tailwindcss")) {
      files.push(
        this.file("apps/web/tailwind.config.mts", this.getTailwindConfig(), {
          mergeStrategy: "replace",
          priority: 20,
        }),
      );
    }

    return files;
  }

  protected override getDependencies(context: GeneratorContext): DependencySpec[] {
    const deps: DependencySpec[] = [
      // Core Next.js
      { name: "next", version: "^15.1.0", type: "prod", target: "apps/web", pluginId: "nextjs" },
      { name: "react", version: "^19.0.0", type: "prod", target: "apps/web", pluginId: "nextjs" },
      { name: "react-dom", version: "^19.0.0", type: "prod", target: "apps/web", pluginId: "nextjs" },
      
      // Types
      { name: "@types/react", version: "^19.0.0", type: "dev", target: "apps/web", pluginId: "nextjs" },
      { name: "@types/react-dom", version: "^19.0.0", type: "dev", target: "apps/web", pluginId: "nextjs" },
    ];

    // Add Tailwind dependencies if enabled
    if (this.hasPlugin(context, "tailwindcss")) {
      deps.push(
        { name: "tailwindcss", version: "^4.0.0", type: "dev", target: "apps/web", pluginId: "nextjs" },
        { name: "postcss", version: "^8.4.49", type: "dev", target: "apps/web", pluginId: "nextjs" },
        { name: "autoprefixer", version: "^10.4.20", type: "dev", target: "apps/web", pluginId: "nextjs" },
      );
    }

    return deps;
  }

  protected override getScripts(_context: GeneratorContext): ScriptSpec[] {
    return [
      { name: "dev", command: "next dev", target: "apps/web", description: "Start Next.js dev server", pluginId: "nextjs" },
      { name: "build", command: "next build", target: "apps/web", description: "Build Next.js application", pluginId: "nextjs" },
      { name: "start", command: "next start", target: "apps/web", description: "Start production server", pluginId: "nextjs" },
      { name: "type-check", command: "tsc --noEmit", target: "apps/web", description: "Type check without emit", pluginId: "nextjs" },
    ];
  }

  private getNextConfig(context: GeneratorContext): string {
    const config: string[] = [];

    config.push(`import type { NextConfig } from "next";`);
    config.push("");
    config.push("const nextConfig: NextConfig = {");
    config.push("  reactStrictMode: true,");
    
    // Add transpile packages if using monorepo packages
    config.push('  transpilePackages: ["@' + context.projectConfig.name + '/ui"],');

    // Add experimental features
    config.push("  experimental: {");
    config.push("    typedRoutes: true,");
    config.push("  },");

    config.push("};");
    config.push("");
    config.push("export default nextConfig;");

    return config.join("\n");
  }

  private getWebPackageJson(projectName: string): string {
    return JSON.stringify(
      {
        name: `@${projectName}/web`,
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          "type-check": "tsc --noEmit",
        },
      },
      null,
      2,
    );
  }

  private getWebTsConfig(projectName: string): string {
    return JSON.stringify(
      {
        extends: "../../tsconfig.base.json",
        compilerOptions: {
          lib: ["dom", "dom.iterable", "esnext"],
          jsx: "preserve",
          module: "ESNext",
          moduleResolution: "bundler",
          plugins: [{ name: "next" }],
          paths: {
            "@/*": ["./src/*"],
            [`@${projectName}/*`]: ["../../packages/*/src"],
          },
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"],
      },
      null,
      2,
    );
  }

  private getRootLayout(context: GeneratorContext): string {
    const hasTailwind = this.hasPlugin(context, "tailwindcss");
    const hasThemes = this.hasPlugin(context, "next-themes");

    const imports: string[] = [
      `import type { Metadata } from "next";`,
    ];

    if (hasTailwind) {
      imports.push(`import "./globals.css";`);
    }

    if (hasThemes) {
      imports.push(`import { ThemeProvider } from "@/components/theme-provider";`);
    }

    let children = "{children}";
    if (hasThemes) {
      children = `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>`;
    }

    return `${imports.join("\n")}

export const metadata: Metadata = {
  title: "${context.projectConfig.name}",
  description: "Generated by scaffold CLI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        ${children}
      </body>
    </html>
  );
}
`;
  }

  private getRootPage(): string {
    return `export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Welcome to Your App</h1>
      <p className="mt-4 text-lg text-gray-600">
        Get started by editing <code>src/app/page.tsx</code>
      </p>
    </main>
  );
}
`;
  }

  private getGlobalsCss(context: GeneratorContext): string {
    if (this.hasPlugin(context, "tailwindcss")) {
      return `@import "tailwindcss";
`;
    }
    
    return `* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}
`;
  }

  private getPostCssConfig(): string {
    return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
  }

  private getTailwindConfig(): string {
    return `import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
`;
  }
}
