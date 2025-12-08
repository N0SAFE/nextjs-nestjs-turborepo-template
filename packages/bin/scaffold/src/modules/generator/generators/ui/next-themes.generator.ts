/**
 * Next Themes Generator
 *
 * Sets up next-themes for dark mode support.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
} from "../../../../types/generator.types";

@Injectable()
export class NextThemesGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "next-themes",
    priority: 50,
    version: "1.0.0",
    description: "Dark mode support with next-themes",
    dependencies: ["nextjs", "tailwindcss"],
    contributesTo: ["apps/web/src/providers/*", "apps/web/src/components/*"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    return [
      this.file("apps/web/src/providers/theme-provider.tsx", this.getThemeProvider()),
      this.file("apps/web/src/providers/index.ts", this.getProvidersIndex()),
      this.file("apps/web/src/components/theme-toggle.tsx", this.getThemeToggle()),
      this.file("apps/web/src/hooks/use-theme.ts", this.getUseThemeHook()),
    ];
  }

  protected override getDependencies(context: GeneratorContext): DependencySpec[] {
    return [
      { name: "next-themes", version: "^0.4.4", type: "prod", target: "web" },
    ];
  }

  private getThemeProvider(): string {
    return `"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

/**
 * Theme provider component that wraps the application
 * 
 * @example
 * \`\`\`tsx
 * // In your root layout
 * import { ThemeProvider } from "@/providers/theme-provider";
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="en" suppressHydrationWarning>
 *       <body>
 *         <ThemeProvider>
 *           {children}
 *         </ThemeProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * \`\`\`
 */
export function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

export type { ThemeProviderProps };
`;
  }

  private getProvidersIndex(): string {
    return `export { ThemeProvider, type ThemeProviderProps } from "./theme-provider";
`;
  }

  private getThemeToggle(): string {
    return `"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@repo-ui/base";

/**
 * Theme toggle component that switches between light, dark, and system themes
 * 
 * @example
 * \`\`\`tsx
 * import { ThemeToggle } from "@/components/theme-toggle";
 * 
 * function Header() {
 *   return (
 *     <header>
 *       <ThemeToggle />
 *     </header>
 *   );
 * }
 * \`\`\`
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <span className="sr-only">Toggle theme</span>
        <ThemeIcon theme="light" />
      </Button>
    );
  }

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      title={\`Current theme: \${theme}\`}
    >
      <span className="sr-only">Toggle theme</span>
      <ThemeIcon theme={resolvedTheme || "light"} />
    </Button>
  );
}

function ThemeIcon({ theme }: { theme: string }) {
  if (theme === "dark") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

/**
 * Dropdown menu theme toggle for more control
 */
export function ThemeDropdown() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Theme:</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
`;
  }

  private getUseThemeHook(): string {
    return `"use client";

import { useTheme as useNextTheme } from "next-themes";

export interface UseThemeReturn {
  /** Current theme name */
  theme: string | undefined;
  /** Set the current theme */
  setTheme: (theme: string) => void;
  /** Resolved theme (actual applied theme, handles 'system') */
  resolvedTheme: string | undefined;
  /** Available themes */
  themes: string[];
  /** System theme preference */
  systemTheme: string | undefined;
  /** Force a specific theme */
  forcedTheme: string | undefined;
}

/**
 * Hook to access and control the theme
 * 
 * @example
 * \`\`\`tsx
 * import { useTheme } from "@/hooks/use-theme";
 * 
 * function MyComponent() {
 *   const { theme, setTheme, resolvedTheme } = useTheme();
 *   
 *   return (
 *     <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
 *       Toggle theme
 *     </button>
 *   );
 * }
 * \`\`\`
 */
export function useTheme(): UseThemeReturn {
  return useNextTheme() as UseThemeReturn;
}

/**
 * Check if the current theme is dark
 */
export function useIsDark(): boolean {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark";
}

/**
 * Check if the current theme is light
 */
export function useIsLight(): boolean {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "light";
}

/**
 * Toggle between light and dark themes
 */
export function useToggleTheme(): () => void {
  const { setTheme, resolvedTheme } = useTheme();
  return () => setTheme(resolvedTheme === "dark" ? "light" : "dark");
}
`;
  }
}
