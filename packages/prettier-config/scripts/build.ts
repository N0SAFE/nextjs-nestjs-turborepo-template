import { build, Glob, type BuildConfig } from 'bun';
import { existsSync, rmSync } from 'fs';
import path from 'path';

const __dirname = import.meta.dir;
const packageRoot = path.resolve(__dirname, '..');
const srcDir = path.join(packageRoot, 'src');
const distDir = path.join(packageRoot, 'dist');
const distEsmDir = path.join(distDir, 'esm');
const distCjsDir = path.join(distDir, 'cjs');

// Parse command line arguments
const args = process.argv.slice(2);
const watch = args.includes('--watch');

// Cleanup function
function cleanup() {
  if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true });
  }
}

// Filter function to exclude test files
function isTestFile(filePath: string): boolean {
  // Exclude files ending with .test.ts or .spec.ts
  if (filePath.endsWith('.test.ts') || filePath.endsWith('.test.tsx') || 
      filePath.endsWith('.spec.ts') || filePath.endsWith('.spec.tsx')) {
    return true;
  }
  // Exclude files in test directories
  const testDirNames = ['__tests__', 'tests', 'test', '__test__'];
  return testDirNames.some(dir => filePath.includes(`/${dir}/`) || filePath.startsWith(`${dir}/`));
}

// Build function
async function runBuild(buildWatch: boolean) {
  const glob = new Glob('**/*.ts');
  const files: string[] = [];
  for await (const file of glob.scan({ cwd: srcDir })) {
    if (!isTestFile(file)) {
      files.push(file);
    }
  }

  console.log(`Building ${files.length} files from ${srcDir}${buildWatch ? ' (watching for changes)' : ''}...`);

  // Shared build configuration
  const sharedConfig: Partial<BuildConfig> = {
    entrypoints: files.map((file) => path.join(srcDir, file)),
    minify: true,
    splitting: true,
    target: 'bun',
    external: [
      'prettier',
      'prettier-plugin-tailwindcss',
    ],
  };

  // Build both ESM and CJS in parallel
  const formatConfigs: Array<[string, string, Partial<BuildConfig>]> = [
    ['esm', distEsmDir, {}],
    ['cjs', distCjsDir, { format: 'cjs' }],
  ];

  const results = await Promise.all(
    formatConfigs.map(async ([formatName, outdir, overrides]) => {
      console.log(`🎬 Building ${formatName.toUpperCase()} format to ${outdir}...`);
      const buildConfig: BuildConfig = {
        ...sharedConfig,
        outdir,
        ...overrides,
      } as BuildConfig;

      const result = await build(buildConfig);
      return { formatName, result };
    }),
  );

  // Handle results
  let hasFailures = false;
  for (const { formatName, result } of results) {
    if (!result.success) {
      console.error(`❌ ${formatName.toUpperCase()} build failed:`, result);
      hasFailures = true;
    } else {
      console.log(`✅ ${formatName.toUpperCase()} build successful`);
    }
  }

  if (hasFailures) {
    process.exit(1);
  }

  console.log(`✅ Successfully built ${files.length} files to dist/esm and dist/cjs`);
}

// Main execution
(async () => {
  cleanup();
  await runBuild(watch);
})();

