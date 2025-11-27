import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Mock package health data - in real implementation, this would analyze package.json files
    const packagesData = {
      summary: {
        totalPackages: 15,
        totalDependencies: 247,
        outdated: 12,
        duplicates: 5,
        healthScore: 87,
        securityIssues: 2,
        licenseIssues: 0,
      },
      packages: [
        {
          name: "web",
          type: "app",
          dependencies: 45,
          devDependencies: 23,
          outdated: 3,
          vulnerabilities: { critical: 0, high: 1, medium: 0, low: 1 },
          health: 85,
          license: "MIT",
        },
        {
          name: "api",
          type: "app",
          dependencies: 38,
          devDependencies: 19,
          outdated: 2,
          vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
          health: 92,
          license: "MIT",
        },
        {
          name: "doc",
          type: "app",
          dependencies: 28,
          devDependencies: 15,
          outdated: 1,
          vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
          health: 95,
          license: "MIT",
        },
        {
          name: "@repo/ui",
          type: "package",
          dependencies: 34,
          devDependencies: 12,
          outdated: 2,
          vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
          health: 90,
          license: "MIT",
        },
        {
          name: "@repo/api-contracts",
          type: "package",
          dependencies: 5,
          devDependencies: 3,
          outdated: 0,
          vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
          health: 98,
          license: "MIT",
        },
        {
          name: "@repo/types",
          type: "package",
          dependencies: 2,
          devDependencies: 4,
          outdated: 0,
          vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
          health: 100,
          license: "MIT",
        },
        {
          name: "stats-dashboard",
          type: "app",
          dependencies: 32,
          devDependencies: 18,
          outdated: 4,
          vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
          health: 88,
          license: "MIT",
        },
      ],
      dependencies: {
        graph: [
          { from: "web", to: "@repo/ui", type: "direct" },
          { from: "web", to: "@repo/api-contracts", type: "direct" },
          { from: "web", to: "@repo/types", type: "direct" },
          { from: "api", to: "@repo/api-contracts", type: "direct" },
          { from: "api", to: "@repo/types", type: "direct" },
          { from: "stats-dashboard", to: "@repo/ui", type: "direct" },
          { from: "doc", to: "@repo/ui", type: "direct" },
        ],
        duplicates: [
          { package: "react", versions: ["18.3.1", "18.2.0"], count: 2 },
          { package: "typescript", versions: ["5.6.3"], count: 15 },
          { package: "zod", versions: ["3.23.8", "3.22.4"], count: 2 },
        ],
      },
    };

    return NextResponse.json(packagesData);
  } catch (error) {
    console.error("Error reading package data:", error);
    return NextResponse.json(
      { error: "Failed to load package data" },
      { status: 500 }
    );
  }
}
