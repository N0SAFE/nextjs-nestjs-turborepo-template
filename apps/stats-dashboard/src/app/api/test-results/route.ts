import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Mock test results data - in real implementation, this would read from test output files
    const testResults = {
      latest: {
        timestamp: new Date().toISOString(),
        summary: {
          total: 183,
          passed: 168,
          failed: 15,
          skipped: 0,
          duration: 12.45,
        },
        byPackage: [
          {
            name: "@repo-configs/eslint",
            total: 8,
            passed: 8,
            failed: 0,
            duration: 1.2,
          },
          {
            name: "@repo/prettier-config",
            total: 12,
            passed: 12,
            failed: 0,
            duration: 1.5,
          },
          {
            name: "api",
            total: 4,
            passed: 4,
            failed: 0,
            duration: 2.1,
          },
          {
            name: "@repo/types",
            total: 16,
            passed: 16,
            failed: 0,
            duration: 1.8,
          },
          {
            name: "@repo/ui",
            total: 54,
            passed: 54,
            failed: 0,
            duration: 3.2,
          },
          {
            name: "web",
            total: 22,
            passed: 22,
            failed: 0,
            duration: 2.3,
          },
          {
            name: "@repo-configs/typescript",
            total: 2,
            passed: 0,
            failed: 2,
            duration: 0.5,
          },
          {
            name: "@repo/tailwind-config",
            total: 1,
            passed: 0,
            failed: 1,
            duration: 0.3,
          },
          {
            name: "bin",
            total: 12,
            passed: 0,
            failed: 12,
            duration: 1.5,
          },
        ],
        failures: [
          {
            package: "@repo-configs/typescript",
            test: "base.json should have target property",
            error: "Missing target property in compiler options",
            file: "__tests__/config.test.ts",
            line: 45,
          },
          {
            package: "@repo-configs/typescript",
            test: "Module validation case sensitivity",
            error: "Expected 'esnext' but got different casing",
            file: "__tests__/config.test.ts",
            line: 67,
          },
          {
            package: "@repo/tailwind-config",
            test: "Content patterns should include wildcards",
            error: "Expected wildcard patterns (*.ts, *.tsx) in content paths",
            file: "__tests__/config.test.ts",
            line: 23,
          },
        ],
      },
      history: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total: 183,
        passed: Math.max(150, 168 - Math.floor(Math.random() * 20)),
        failed: Math.min(33, 15 + Math.floor(Math.random() * 20)),
        duration: 12.45 + (Math.random() - 0.5) * 4,
      })),
    };

    return NextResponse.json(testResults);
  } catch (error) {
    console.error("Error reading test results:", error);
    return NextResponse.json(
      { error: "Failed to load test results" },
      { status: 500 }
    );
  }
}
