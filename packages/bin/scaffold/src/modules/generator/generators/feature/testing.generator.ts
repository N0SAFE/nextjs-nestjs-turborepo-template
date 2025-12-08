import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  DependencySpec,
  FileSpec,
  GeneratorContext,
  ScriptSpec,
} from "../../../../types/generator.types";

/**
 * Testing Generator
 *
 * Extended testing configuration including:
 * - Enhanced Vitest setup with test utilities
 * - MSW (Mock Service Worker) for API mocking
 * - Testing Library utilities for React components
 * - Snapshot testing helpers
 * - Custom matchers and assertions
 * - Test factories and fixtures
 * - Coverage configuration and badges
 * - E2E testing preparation with Playwright
 *
 * This generator builds upon the base vitest generator
 * to provide a comprehensive testing infrastructure.
 */
@Injectable()
export class TestingGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "testing",
    priority: 15,
    version: "1.0.0",
    description:
      "Enhanced testing infrastructure with MSW, Testing Library, test utilities, and E2E preparation",
    contributesTo: ["vitest.setup.ts", "packages/testing/"],
    dependsOn: ["vitest"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];
    const hasReact = this.hasPlugin(context, "nextjs") || this.hasPlugin(context, "react");
    const hasNestjs = this.hasPlugin(context, "nestjs");

    // Root-level test setup
    files.push(
      this.file("vitest.setup.ts", this.generateVitestSetup(hasReact), {
        mergeStrategy: "replace",
        priority: 15,
      }),
    );

    // Testing utilities package
    files.push(
      this.file(
        "packages/testing/package.json",
        this.generateTestingPackageJson(),
        { mergeStrategy: "replace", priority: 15 },
      ),
    );

    files.push(
      this.file("packages/testing/tsconfig.json", this.generateTsconfig(), {
        mergeStrategy: "replace",
        priority: 15,
      }),
    );

    files.push(
      this.file(
        "packages/testing/src/index.ts",
        this.generateTestingIndex(hasReact, hasNestjs),
        { mergeStrategy: "replace", priority: 15 },
      ),
    );

    // Custom matchers
    files.push(
      this.file(
        "packages/testing/src/matchers/index.ts",
        this.generateCustomMatchers(),
        { mergeStrategy: "replace", priority: 15 },
      ),
    );

    // Test factories
    files.push(
      this.file(
        "packages/testing/src/factories/index.ts",
        this.generateFactoriesIndex(),
        { mergeStrategy: "replace", priority: 15 },
      ),
    );

    files.push(
      this.file(
        "packages/testing/src/factories/user.factory.ts",
        this.generateUserFactory(),
        { mergeStrategy: "replace", priority: 15 },
      ),
    );

    // MSW handlers
    files.push(
      this.file(
        "packages/testing/src/mocks/handlers.ts",
        this.generateMswHandlers(context),
        { mergeStrategy: "replace", priority: 15 },
      ),
    );

    files.push(
      this.file(
        "packages/testing/src/mocks/server.ts",
        this.generateMswServer(),
        { mergeStrategy: "replace", priority: 15 },
      ),
    );

    files.push(
      this.file(
        "packages/testing/src/mocks/browser.ts",
        this.generateMswBrowser(),
        { mergeStrategy: "replace", priority: 15 },
      ),
    );

    // React testing utilities
    if (hasReact) {
      files.push(
        this.file(
          "packages/testing/src/react/index.ts",
          this.generateReactTestUtils(),
          { mergeStrategy: "replace", priority: 15 },
        ),
      );

      files.push(
        this.file(
          "packages/testing/src/react/render.tsx",
          this.generateCustomRender(),
          { mergeStrategy: "replace", priority: 15 },
        ),
      );

      files.push(
        this.file(
          "packages/testing/src/react/providers.tsx",
          this.generateTestProviders(),
          { mergeStrategy: "replace", priority: 15 },
        ),
      );
    }

    // NestJS testing utilities
    if (hasNestjs) {
      files.push(
        this.file(
          "packages/testing/src/nestjs/index.ts",
          this.generateNestjsTestUtils(),
          { mergeStrategy: "replace", priority: 15 },
        ),
      );

      files.push(
        this.file(
          "packages/testing/src/nestjs/test-module.ts",
          this.generateTestModuleHelper(),
          { mergeStrategy: "replace", priority: 15 },
        ),
      );
    }

    // Playwright configuration (E2E preparation)
    files.push(
      this.file(
        "playwright.config.ts",
        this.generatePlaywrightConfig(context),
        { mergeStrategy: "replace", priority: 15, skipIfExists: true },
      ),
    );

    // E2E test example
    files.push(
      this.file("e2e/example.spec.ts", this.generateE2eExample(), {
        mergeStrategy: "replace",
        priority: 15,
        skipIfExists: true,
      }),
    );

    // Test utilities documentation
    files.push(
      this.file("packages/testing/README.md", this.generateTestingReadme(), {
        mergeStrategy: "replace",
        priority: 15,
        skipIfExists: true,
      }),
    );

    return files;
  }

  protected override getDependencies(context: GeneratorContext): DependencySpec[] {
    const deps: DependencySpec[] = [
      // MSW for API mocking
      {
        name: "msw",
        version: "^2.6.0",
        type: "dev",
        target: "root",
        pluginId: "testing",
      },
      // Faker for test data generation
      {
        name: "@faker-js/faker",
        version: "^9.2.0",
        type: "dev",
        target: "root",
        pluginId: "testing",
      },
      // Playwright for E2E
      {
        name: "@playwright/test",
        version: "^1.49.0",
        type: "dev",
        target: "root",
        pluginId: "testing",
      },
    ];

    const hasReact = this.hasPlugin(context, "nextjs") || this.hasPlugin(context, "react");

    if (hasReact) {
      deps.push(
        {
          name: "@testing-library/react",
          version: "^16.0.0",
          type: "dev",
          target: "root",
          pluginId: "testing",
        },
        {
          name: "@testing-library/jest-dom",
          version: "^6.6.0",
          type: "dev",
          target: "root",
          pluginId: "testing",
        },
        {
          name: "@testing-library/user-event",
          version: "^14.5.0",
          type: "dev",
          target: "root",
          pluginId: "testing",
        },
        {
          name: "jsdom",
          version: "^25.0.0",
          type: "dev",
          target: "root",
          pluginId: "testing",
        },
      );
    }

    return deps;
  }

  protected override getScripts(_context: GeneratorContext): ScriptSpec[] {
    return [
      {
        name: "test:e2e",
        command: "playwright test",
        target: "root",
      },
      {
        name: "test:e2e:ui",
        command: "playwright test --ui",
        target: "root",
      },
      {
        name: "test:e2e:debug",
        command: "playwright test --debug",
        target: "root",
      },
      {
        name: "test:integration",
        command: "vitest run --config vitest.integration.config.mts",
        target: "root",
      },
    ];
  }

  private generateVitestSetup(hasReact: boolean): string {
    const imports = [`import { vi, beforeAll, afterAll, afterEach } from "vitest";`];
    const setupContent: string[] = [];

    if (hasReact) {
      imports.push(`import "@testing-library/jest-dom/vitest";`);
      imports.push(`import { cleanup } from "@testing-library/react";`);
      setupContent.push(`
// Cleanup after each test
afterEach(() => {
  cleanup();
});`);
    }

    imports.push(`import { server } from "@repo/testing/mocks/server";`);

    return `${imports.join("\n")}

// Global test setup

// MSW Server setup
beforeAll(() => {
  server.listen({ onUnhandledRequest: "bypass" });
});

afterAll(() => {
  server.close();
});

afterEach(() => {
  server.resetHandlers();
});
${setupContent.join("\n")}

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  root: null,
  rootMargin: "",
  thresholds: [],
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn().mockReturnValue([]),
}));

// Suppress console errors/warnings in tests (optional)
// Uncomment if you want cleaner test output
// vi.spyOn(console, 'error').mockImplementation(() => {});
// vi.spyOn(console, 'warn').mockImplementation(() => {});
`;
  }

  private generateTestingPackageJson(): string {
    return JSON.stringify(
      {
        name: "@repo/testing",
        version: "0.0.0",
        private: true,
        main: "./src/index.ts",
        types: "./src/index.ts",
        exports: {
          ".": "./src/index.ts",
          "./matchers": "./src/matchers/index.ts",
          "./factories": "./src/factories/index.ts",
          "./mocks/server": "./src/mocks/server.ts",
          "./mocks/browser": "./src/mocks/browser.ts",
          "./mocks/handlers": "./src/mocks/handlers.ts",
          "./react": "./src/react/index.ts",
          "./nestjs": "./src/nestjs/index.ts",
        },
        scripts: {
          "type-check": "tsc --noEmit",
        },
        dependencies: {
          "@faker-js/faker": "^9.2.0",
        },
        peerDependencies: {
          vitest: "^2.0.0",
          msw: "^2.0.0",
        },
        devDependencies: {
          typescript: "^5.6.0",
        },
      },
      null,
      2,
    );
  }

  private generateTsconfig(): string {
    return JSON.stringify(
      {
        extends: "@repo/typescript-config/base.json",
        compilerOptions: {
          outDir: "./dist",
          rootDir: "./src",
          declaration: true,
          declarationMap: true,
        },
        include: ["src/**/*"],
        exclude: ["node_modules", "dist"],
      },
      null,
      2,
    );
  }

  private generateTestingIndex(hasReact: boolean, hasNestjs: boolean): string {
    const exports = [
      `export * from "./matchers";`,
      `export * from "./factories";`,
    ];

    if (hasReact) {
      exports.push(`export * from "./react";`);
    }
    if (hasNestjs) {
      exports.push(`export * from "./nestjs";`);
    }

    return `/**
 * @repo/testing
 *
 * Shared testing utilities and configuration
 */

${exports.join("\n")}

// Re-export common testing utilities
export { faker } from "@faker-js/faker";
`;
  }

  private generateCustomMatchers(): string {
    return `/**
 * Custom Vitest matchers
 */
import { expect } from "vitest";

// Extend Vitest matchers
expect.extend({
  /**
   * Check if a value is a valid UUID
   */
  toBeUUID(received: unknown) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = typeof received === "string" && uuidRegex.test(received);
    return {
      pass,
      message: () =>
        pass
          ? \`Expected \${received} not to be a valid UUID\`
          : \`Expected \${received} to be a valid UUID\`,
    };
  },

  /**
   * Check if a value is a valid ISO date string
   */
  toBeISODateString(received: unknown) {
    const pass =
      typeof received === "string" && !isNaN(Date.parse(received));
    return {
      pass,
      message: () =>
        pass
          ? \`Expected \${received} not to be a valid ISO date string\`
          : \`Expected \${received} to be a valid ISO date string\`,
    };
  },

  /**
   * Check if an object has all specified keys
   */
  toHaveAllKeys(received: unknown, keys: string[]) {
    const receivedKeys = Object.keys(received as object);
    const missingKeys = keys.filter((key) => !receivedKeys.includes(key));
    const pass = missingKeys.length === 0;
    return {
      pass,
      message: () =>
        pass
          ? \`Expected object not to have keys: \${keys.join(", ")}\`
          : \`Expected object to have keys: \${missingKeys.join(", ")}\`,
    };
  },

  /**
   * Check if an array contains only unique values
   */
  toContainOnlyUniqueValues(received: unknown[]) {
    const unique = new Set(received);
    const pass = unique.size === received.length;
    return {
      pass,
      message: () =>
        pass
          ? \`Expected array to contain duplicate values\`
          : \`Expected array to contain only unique values, found duplicates\`,
    };
  },
});

// Type declarations for custom matchers
declare module "vitest" {
  interface Assertion<T = unknown> {
    toBeUUID(): void;
    toBeISODateString(): void;
    toHaveAllKeys(keys: string[]): void;
    toContainOnlyUniqueValues(): void;
  }
  interface AsymmetricMatchersContaining {
    toBeUUID(): void;
    toBeISODateString(): void;
    toHaveAllKeys(keys: string[]): void;
    toContainOnlyUniqueValues(): void;
  }
}

export {};
`;
  }

  private generateFactoriesIndex(): string {
    return `/**
 * Test Factories Index
 *
 * Re-exports all test factories for easy importing
 */
export * from "./user.factory";

// Factory helper types
export interface Factory<T> {
  build(overrides?: Partial<T>): T;
  buildList(count: number, overrides?: Partial<T>): T[];
}

/**
 * Create a factory for generating test data
 */
export function createFactory<T>(
  defaultValues: () => T,
): Factory<T> {
  return {
    build(overrides?: Partial<T>): T {
      return { ...defaultValues(), ...overrides };
    },
    buildList(count: number, overrides?: Partial<T>): T[] {
      return Array.from({ length: count }, () => this.build(overrides));
    },
  };
}
`;
  }

  private generateUserFactory(): string {
    return `/**
 * User Factory
 *
 * Generate test user data
 */
import { faker } from "@faker-js/faker";
import { createFactory } from "./index";

export interface TestUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
}

export const userFactory = createFactory<TestUser>(() => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  avatar: faker.image.avatar(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  emailVerified: faker.datatype.boolean(),
}));

/**
 * Create an authenticated user (email verified)
 */
export function createAuthenticatedUser(
  overrides?: Partial<TestUser>,
): TestUser {
  return userFactory.build({
    emailVerified: true,
    ...overrides,
  });
}

/**
 * Create a pending user (email not verified)
 */
export function createPendingUser(overrides?: Partial<TestUser>): TestUser {
  return userFactory.build({
    emailVerified: false,
    ...overrides,
  });
}
`;
  }

  private generateMswHandlers(context: GeneratorContext): string {
    const apiUrl = "http://localhost:3001";

    return `/**
 * MSW Request Handlers
 *
 * Define API mock handlers for testing
 */
import { http, HttpResponse } from "msw";
import { userFactory } from "../factories";

const API_URL = "${apiUrl}";

export const handlers = [
  // Health check
  http.get(\`\${API_URL}/health\`, () => {
    return HttpResponse.json({ status: "ok", timestamp: new Date().toISOString() });
  }),

  // User endpoints
  http.get(\`\${API_URL}/api/users/me\`, () => {
    return HttpResponse.json(userFactory.build());
  }),

  http.get(\`\${API_URL}/api/users\`, ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    return HttpResponse.json({
      users: userFactory.buildList(limit),
      total: 100,
      page: 1,
      limit,
    });
  }),

  http.get(\`\${API_URL}/api/users/:id\`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json(userFactory.build({ id: id as string }));
  }),

  http.post(\`\${API_URL}/api/users\`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json(userFactory.build(body), { status: 201 });
  }),

  http.patch(\`\${API_URL}/api/users/:id\`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json(userFactory.build({ id: id as string, ...body }));
  }),

  http.delete(\`\${API_URL}/api/users/:id\`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Auth endpoints
  http.post(\`\${API_URL}/api/auth/login\`, () => {
    return HttpResponse.json({
      token: "mock-jwt-token",
      user: userFactory.build(),
    });
  }),

  http.post(\`\${API_URL}/api/auth/logout\`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(\`\${API_URL}/api/auth/refresh\`, () => {
    return HttpResponse.json({
      token: "mock-refreshed-jwt-token",
    });
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = {
  unauthorized: http.get(\`\${API_URL}/*\`, () => {
    return HttpResponse.json(
      { message: "Unauthorized" },
      { status: 401 },
    );
  }),

  notFound: http.get(\`\${API_URL}/*\`, () => {
    return HttpResponse.json(
      { message: "Not found" },
      { status: 404 },
    );
  }),

  serverError: http.get(\`\${API_URL}/*\`, () => {
    return HttpResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }),

  networkError: http.get(\`\${API_URL}/*\`, () => {
    return HttpResponse.error();
  }),
};
`;
  }

  private generateMswServer(): string {
    return `/**
 * MSW Server Setup
 *
 * For use in Node.js test environments (Vitest, Jest)
 */
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
`;
  }

  private generateMswBrowser(): string {
    return `/**
 * MSW Browser Setup
 *
 * For use in browser test environments (Storybook, Cypress component testing)
 */
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
`;
  }

  private generateReactTestUtils(): string {
    return `/**
 * React Testing Utilities
 *
 * Custom render functions and testing helpers
 */
export * from "./render";
export * from "./providers";

// Re-export everything from testing-library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
`;
  }

  private generateCustomRender(): string {
    return `/**
 * Custom Render Function
 *
 * Wraps components with necessary providers for testing
 */
import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { AllProviders, type AllProvidersProps } from "./providers";

interface CustomRenderOptions extends RenderOptions {
  providerProps?: Partial<AllProvidersProps>;
}

/**
 * Custom render function that wraps components with test providers
 */
function customRender(
  ui: React.ReactElement,
  options: CustomRenderOptions = {},
) {
  const { providerProps, ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <AllProviders {...providerProps}>{children}</AllProviders>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything
export * from "@testing-library/react";

// Override render with custom render
export { customRender as render };
`;
  }

  private generateTestProviders(): string {
    return `/**
 * Test Providers
 *
 * Providers wrapper for testing React components
 */
import React from "react";

export interface AllProvidersProps {
  children: React.ReactNode;
  initialState?: Record<string, unknown>;
  routerProps?: {
    initialEntries?: string[];
  };
}

/**
 * Combines all necessary providers for testing
 * Add your providers here (QueryClientProvider, ThemeProvider, etc.)
 */
export function AllProviders({
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initialState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  routerProps,
}: AllProvidersProps) {
  // Add your providers here as the application grows
  // Example:
  // const queryClient = new QueryClient({
  //   defaultOptions: {
  //     queries: { retry: false },
  //     mutations: { retry: false },
  //   },
  // });

  return (
    // <QueryClientProvider client={queryClient}>
    //   <ThemeProvider>
    //     {children}
    //   </ThemeProvider>
    // </QueryClientProvider>
    <>{children}</>
  );
}
`;
  }

  private generateNestjsTestUtils(): string {
    return `/**
 * NestJS Testing Utilities
 *
 * Helpers for testing NestJS applications
 */
export * from "./test-module";
`;
  }

  private generateTestModuleHelper(): string {
    return `/**
 * Test Module Helper
 *
 * Creates pre-configured testing modules for NestJS
 */
import { Test, type TestingModule, type TestingModuleBuilder } from "@nestjs/testing";

export interface CreateTestModuleOptions {
  imports?: unknown[];
  controllers?: unknown[];
  providers?: unknown[];
  overrideProviders?: Array<{
    provide: unknown;
    useValue?: unknown;
    useClass?: unknown;
    useFactory?: () => unknown;
  }>;
}

/**
 * Create a testing module with common configuration
 */
export async function createTestModule(
  options: CreateTestModuleOptions = {},
): Promise<TestingModule> {
  const {
    imports = [],
    controllers = [],
    providers = [],
    overrideProviders = [],
  } = options;

  let moduleBuilder: TestingModuleBuilder = Test.createTestingModule({
    imports,
    controllers,
    providers,
  });

  // Apply provider overrides
  for (const override of overrideProviders) {
    if (override.useValue !== undefined) {
      moduleBuilder = moduleBuilder
        .overrideProvider(override.provide)
        .useValue(override.useValue);
    } else if (override.useClass !== undefined) {
      moduleBuilder = moduleBuilder
        .overrideProvider(override.provide)
        .useClass(override.useClass as new (...args: unknown[]) => unknown);
    } else if (override.useFactory !== undefined) {
      moduleBuilder = moduleBuilder
        .overrideProvider(override.provide)
        .useFactory({ factory: override.useFactory });
    }
  }

  return moduleBuilder.compile();
}

/**
 * Create a mock service with all methods stubbed
 */
export function createMockService<T extends object>(
  methodNames: (keyof T)[],
): jest.Mocked<T> {
  const mock = {} as jest.Mocked<T>;
  for (const methodName of methodNames) {
    // @ts-expect-error - Dynamic assignment
    mock[methodName] = jest.fn();
  }
  return mock;
}

/**
 * Create a mock repository for testing database operations
 */
export function createMockRepository() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
      getManyAndCount: jest.fn(),
    })),
  };
}
`;
  }

  private generatePlaywrightConfig(context: GeneratorContext): string {
    const webPort = 3000;
    const apiPort = 3001;

    return `/**
 * Playwright Configuration
 *
 * E2E testing setup for the application
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["json", { outputFile: "playwright-report/results.json" }],
    process.env.CI ? ["github"] : ["list"],
  ],
  use: {
    baseURL: "http://localhost:${webPort}",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    // Mobile browsers
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
  webServer: [
    {
      command: "bun run dev:api",
      url: "http://localhost:${apiPort}/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: "bun run dev:web",
      url: "http://localhost:${webPort}",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
`;
  }

  private generateE2eExample(): string {
    return `/**
 * Example E2E Test
 *
 * Demonstrates basic Playwright test patterns
 */
import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should display the home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/./);
  });

  test("should have working navigation", async ({ page }) => {
    await page.goto("/");

    // Example: Click on a navigation link
    // await page.click('a[href="/about"]');
    // await expect(page.locator('h1')).toContainText('About');
  });

  test("should be responsive", async ({ page }) => {
    await page.goto("/");

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    // Add assertions for mobile layout

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    // Add assertions for desktop layout
  });
});

test.describe("API Health", () => {
  test("should return healthy status", async ({ request }) => {
    const response = await request.get("http://localhost:3001/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
  });
});

test.describe("Authentication Flow", () => {
  test.skip("should allow user to log in", async ({ page }) => {
    await page.goto("/auth/login");

    // Fill in login form
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
  });
});
`;
  }

  private generateTestingReadme(): string {
    return `# @repo/testing

Shared testing utilities and configuration for the monorepo.

## Installation

This package is internal to the monorepo and should already be available.

## Usage

### Custom Render

\`\`\`tsx
import { render, screen, userEvent } from "@repo/testing/react";

test("renders component", async () => {
  render(<MyComponent />);

  await userEvent.click(screen.getByRole("button"));

  expect(screen.getByText("Clicked")).toBeInTheDocument();
});
\`\`\`

### Test Factories

\`\`\`ts
import { userFactory, createAuthenticatedUser } from "@repo/testing/factories";

test("creates test users", () => {
  // Single user
  const user = userFactory.build();

  // User with overrides
  const admin = userFactory.build({ name: "Admin User" });

  // Multiple users
  const users = userFactory.buildList(5);

  // Pre-configured user
  const authUser = createAuthenticatedUser();
});
\`\`\`

### MSW Handlers

\`\`\`ts
import { server } from "@repo/testing/mocks/server";
import { errorHandlers } from "@repo/testing/mocks/handlers";

// Use default handlers (already set up in vitest.setup.ts)

// Override for specific test
test("handles server error", async () => {
  server.use(errorHandlers.serverError);

  // Test error handling...
});
\`\`\`

### Custom Matchers

\`\`\`ts
import "@repo/testing/matchers";

test("validates UUID", () => {
  expect("550e8400-e29b-41d4-a716-446655440000").toBeUUID();
});

test("validates ISO date", () => {
  expect("2024-01-15T10:30:00.000Z").toBeISODateString();
});
\`\`\`

### NestJS Testing

\`\`\`ts
import { createTestModule, createMockRepository } from "@repo/testing/nestjs";

describe("UserService", () => {
  let module: TestingModule;
  let service: UserService;

  beforeEach(async () => {
    module = await createTestModule({
      providers: [UserService],
      overrideProviders: [
        { provide: UserRepository, useValue: createMockRepository() },
      ],
    });

    service = module.get(UserService);
  });

  test("finds user by id", async () => {
    // ...
  });
});
\`\`\`

## Structure

\`\`\`
packages/testing/
├── src/
│   ├── index.ts           # Main exports
│   ├── matchers/          # Custom Vitest matchers
│   ├── factories/         # Test data factories
│   ├── mocks/             # MSW handlers and setup
│   ├── react/             # React testing utilities
│   └── nestjs/            # NestJS testing utilities
└── README.md
\`\`\`

## Adding New Factories

1. Create a new file in \`src/factories/\`
2. Use \`createFactory\` helper:

\`\`\`ts
import { faker } from "@faker-js/faker";
import { createFactory } from "./index";

export interface MyEntity {
  id: string;
  name: string;
}

export const myEntityFactory = createFactory<MyEntity>(() => ({
  id: faker.string.uuid(),
  name: faker.lorem.words(3),
}));
\`\`\`

3. Export from \`src/factories/index.ts\`

## Adding New MSW Handlers

Add handlers to \`src/mocks/handlers.ts\`:

\`\`\`ts
export const handlers = [
  // Existing handlers...

  http.get(\`\${API_URL}/api/my-endpoint\`, () => {
    return HttpResponse.json({ data: "example" });
  }),
];
\`\`\`
`;
  }
}
