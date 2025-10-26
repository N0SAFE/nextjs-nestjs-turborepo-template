import { build, Glob, type BuildConfig } from 'bun';
import { existsSync, rmSync } from 'fs';
import path from 'path';

let chokidar: any = null;
try {
  chokidar = await import('chokidar');
} catch {
  // chokidar not available, watch mode will be unavailable
}

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

async function runBuild(files?: string[]) {
  if (!files || files.length === 0) {
    files = [];
    const glob = new Glob('**/*.ts');
    for await (const file of glob.scan({ cwd: srcDir })) {
      if (!isTestFile(file)) {
        files.push(file);
      }
    }
  }

  console.log(`Building ${files.length} files from ${srcDir}${watch ? ' (watching for changes)' : ''}...`);

  // Shared build configuration
  const sharedConfig: Partial<BuildConfig> = {
    entrypoints: files.map((file) => path.join(srcDir, file)),
    minify: true,
    splitting: true,
    target: 'bun',
    external: [
      // Common dependencies that should not be bundled
      'eslint',
      '@typescript-eslint/eslint-plugin',
      '@typescript-eslint/parser',
      'eslint-config-nestjs',
      '@vercel/style-guide',
      '@next/eslint-plugin-next',
      'eslint-plugin-react',
      'eslint-plugin-react-hooks',
      'eslint-plugin-jsx-a11y',
      'prettier',
      'prettier-plugin-tailwindcss',
      'vitest',
      '@vitejs/plugin-react',
      'jsdom',
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

// Setup file watcher
async function setupWatcher(files: string[]) {
  if (!chokidar) {
    console.error('❌ chokidar not available - watch mode requires: bun add -d chokidar');
    process.exit(1);
  }

  console.log(`👀 Watching ${files.length} files for changes...`);

  const watcher = chokidar.watch(
    files.map(f => path.join(srcDir, f)),
    {
      ignored: /(^|[/\\])\.|node_modules/,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100,
      },
    }
  );

  let isBuilding = false;

  const rebuild = async () => {
    if (isBuilding) return;
    isBuilding = true;
    try {
      await runBuild(files);
    } catch (error) {
      console.error('❌ Build failed:', error);
    } finally {
      isBuilding = false;
    }
  };

  watcher.on('change', rebuild);
  watcher.on('add', rebuild);
  watcher.on('unlink', rebuild);

  console.log('✅ Watcher ready. Press Ctrl+C to stop.');
}

// Main execution
(async () => {
  cleanup();
  
  // Get initial files list
  let files: string[] = [];
  const glob = new Glob('**/*.ts');
  for await (const file of glob.scan({ cwd: srcDir })) {
    if (!isTestFile(file)) {
      files.push(file);
    }
  }

  if (watch) {
    // Watch mode: start watcher after initial build
    await runBuild(files);
    await setupWatcher(files);
  } else {
    // Single build mode
    await runBuild(files);
  }
})();
