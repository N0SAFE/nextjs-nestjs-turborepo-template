import { build, Options } from "tsup";
import { existsSync, rmSync } from "fs";
import { Glob } from "bun";
import path from "path";

let chokidar: any = null;
try {
    chokidar = await import("chokidar");
} catch {
    // chokidar not available, watch mode will be unavailable
}

const __dirname = import.meta.dir;
const packageRoot = path.resolve(__dirname, "..");
const srcDir = path.join(packageRoot, "src");
const distDir = path.join(packageRoot, "dist");
const distEsmDir = path.join(distDir, "esm");
const distCjsDir = path.join(distDir, "cjs");

// Parse command line arguments
const args = process.argv.slice(2);
const watch = args.includes("--watch");

// Cleanup function
function cleanup() {
    if (existsSync(distDir)) {
        rmSync(distDir, { recursive: true });
    }
}

// Filter function to exclude test files
function isTestFile(filePath: string): boolean {
    // Exclude files ending with .test.ts or .spec.ts
    if (filePath.endsWith(".test.ts") || filePath.endsWith(".test.tsx") || filePath.endsWith(".spec.ts") || filePath.endsWith(".spec.tsx")) {
        return true;
    }
    // Exclude files in test directories
    const testDirNames = ["__tests__", "tests", "test", "__test__"];
    return testDirNames.some((dir) => filePath.includes(`/${dir}/`) || filePath.startsWith(`${dir}/`));
}

// Get all TypeScript/TSX files from components, hooks, and lib directories
async function getFiles(): Promise<string[]> {
    const glob = new Glob("**/*.{ts,tsx}");
    const files: string[] = [];

    // Scan components, hooks, and lib directories
    for await (const file of glob.scan({ cwd: path.join(packageRoot, "components") })) {
        const fullPath = path.join("components", file);
        if (!isTestFile(fullPath)) {
            files.push(fullPath);
        }
    }

    for await (const file of glob.scan({ cwd: path.join(packageRoot, "hooks") })) {
        const fullPath = path.join("hooks", file);
        if (!isTestFile(fullPath)) {
            files.push(fullPath);
        }
    }

    for await (const file of glob.scan({ cwd: path.join(packageRoot, "lib") })) {
        const fullPath = path.join("lib", file);
        if (!isTestFile(fullPath)) {
            files.push(fullPath);
        }
    }

    // Add index.ts if it exists and is not a test file
    if (existsSync(path.join(packageRoot, "index.ts")) && !isTestFile("index.ts")) {
        files.push("index.ts");
    }

    return files;
}

// Shared build configuration
function getSharedConfig(format: "esm" | "cjs", outDir: string) {
    return {
        outDir,
        format: [format],
        target: "es2020" as const,
        external: ["react"],
        treeshake: true,
        sourcemap: true,
        clean: false,
    } as Options;
}

// Build function - runs ESM and CJS concurrently
async function runBuild(files: string[], watch: boolean) {
    const entryPoints = files.map((file) => path.join(packageRoot, file));

    try {
        console.log(`🎬 Building ESM and CJS formats concurrently...`);

        await build({
            watch,
            outDir: "dist",
            format: ["cjs", "esm"],
            target: "es2020" as const,
            external: ["react"],
            clean: false,
            entry: entryPoints,
            esbuildOptions(options) {
                options.jsx = "automatic";
            },
        });

        console.log(`✅ Successfully built ${files.length} files to ${distDir}`);
    } catch (error) {
        console.error(`❌ Build failed:`, error);
        process.exit(1);
    }
}

// Main execution
(async () => {
    cleanup();
    const files = await getFiles();

    await runBuild(files, watch);
})();
