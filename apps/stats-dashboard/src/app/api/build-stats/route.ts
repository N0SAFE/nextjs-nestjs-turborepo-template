import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Mock build stats data - in real implementation, this would read from build output files
    const buildStats = {
      buildTimes: {
        summary: {
          average: 145.3,
          fastest: 45.2,
          slowest: 312.5,
          totalPackages: 15,
        },
        byPackage: [
          { name: "web", time: 312.5, trend: "up" },
          { name: "api", time: 245.8, trend: "stable" },
          { name: "doc", time: 156.3, trend: "down" },
          { name: "@repo/ui", time: 189.4, trend: "up" },
          { name: "@repo-configs/eslint", time: 45.2, trend: "stable" },
          { name: "@repo-configs/typescript", time: 52.1, trend: "stable" },
          { name: "@repo-configs/prettier", time: 48.7, trend: "stable" },
          { name: "@repo-configs/vitest", time: 67.3, trend: "down" },
          { name: "@repo-configs/tailwind", time: 78.9, trend: "stable" },
          { name: "@repo/types", time: 102.4, trend: "stable" },
          { name: "@repo/api-contracts", time: 134.6, trend: "up" },
          { name: "@repo/bin", time: 56.8, trend: "stable" },
          { name: "stats-dashboard", time: 201.3, trend: "up" },
        ],
        history: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          average: 145.3 + (Math.random() - 0.5) * 30,
          fastest: 45.2 + (Math.random() - 0.5) * 10,
          slowest: 312.5 + (Math.random() - 0.5) * 50,
        })),
      },
      bundleSizes: {
        summary: {
          total: 1247.5,
          largest: 523.4,
          average: 83.2,
          change: -2.3,
        },
        byPackage: [
          { name: "web", size: 523.4, gzipped: 187.2, change: -1.2 },
          { name: "api", size: 312.7, gzipped: 98.5, change: 0.5 },
          { name: "doc", size: 156.8, gzipped: 54.3, change: -3.1 },
          { name: "@repo/ui", size: 145.3, gzipped: 42.1, change: 1.7 },
          { name: "@repo/api-contracts", size: 34.2, gzipped: 12.3, change: 0.0 },
          { name: "@repo/types", size: 12.5, gzipped: 4.2, change: 0.0 },
          { name: "stats-dashboard", size: 62.6, gzipped: 21.4, change: -5.2 },
        ],
        history: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          total: 1247.5 + (Math.random() - 0.5) * 100,
          largest: 523.4 + (Math.random() - 0.5) * 50,
          average: 83.2 + (Math.random() - 0.5) * 10,
        })),
      },
    };

    return NextResponse.json(buildStats);
  } catch (error) {
    console.error("Error reading build stats:", error);
    return NextResponse.json(
      { error: "Failed to load build stats" },
      { status: 500 }
    );
  }
}
