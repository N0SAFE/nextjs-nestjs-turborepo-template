import { build, Glob } from 'bun';
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
const distDir = path.join(packageRoot, 'dist');

// Parse command line arguments
const args = process.argv.slice(2);
const watch = args.includes('--watch');

// Build configuration
interface BuildConfig {
  entrypoints: string[];
  outdir: string;
  minify: boolean;
  splitting: boolean;
  target: 'bun' | 'browser' | 'node';
  external: string[];
}

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

// Get all TypeScript/TSX files from components, hooks, and lib directories
async function getFiles(): Promise<string[]> {
  const glob = new Glob('**/*.{ts,tsx}');
  const files: string[] = [];

  // Scan components, hooks, and lib directories
  for await (const file of glob.scan({ cwd: path.join(packageRoot, 'components') })) {
    const fullPath = path.join('components', file);
    if (!isTestFile(fullPath)) {
      files.push(fullPath);
    }
  }

  for await (const file of glob.scan({ cwd: path.join(packageRoot, 'hooks') })) {
    const fullPath = path.join('hooks', file);
    if (!isTestFile(fullPath)) {
      files.push(fullPath);
    }
  }

  for await (const file of glob.scan({ cwd: path.join(packageRoot, 'lib') })) {
    const fullPath = path.join('lib', file);
    if (!isTestFile(fullPath)) {
      files.push(fullPath);
    }
  }

  // Add index.ts if it exists and is not a test file
  if (existsSync(path.join(packageRoot, 'index.ts')) && !isTestFile('index.ts')) {
    files.push('index.ts');
  }

  return files;
}

// Build function
async function runBuild(files: string[]) {
  const config: BuildConfig = {
    entrypoints: files.map((file) => path.join(packageRoot, file)),
    outdir: distDir,
    minify: true,
    splitting: true,
    target: 'bun',
    external: [
      // React and common peer dependencies
      'react',
      'react-dom',
      'next',
      'next-themes',
      'framer-motion',
      'sonner',
      'cmdk',
      'lucide-react',
      // Radix UI components
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-icons',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      // Form and validation
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
      // Styling
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'tailwindcss-animate',
      'tw-animate-css',
    ],
  };

  console.log(`Building ${files.length} files${watch ? ' (watching for changes)' : ''}...`);
    
  const result = await build(config);

  if (!result.success) {
    console.error('Build failed:', result);
    process.exit(1);
  }

  console.log(`✅ Successfully built ${files.length} files to ${distDir}`);
}

// Setup file watcher
async function setupWatcher(files: string[]) {
  if (!chokidar) {
    console.error('❌ chokidar not available - watch mode requires: bun add -d chokidar');
    process.exit(1);
  }

  console.log(`👀 Watching ${files.length} files for changes...`);

  const watchPatterns = files.map(f => path.join(packageRoot, f));

  const watcher = chokidar.watch(watchPatterns, {
    ignored: /(^|[/\\])\.|node_modules/,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100,
    },
  });

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
  const files = await getFiles();
  
  if (watch) {
    // Watch mode: start watcher after initial build
    await runBuild(files);
    await setupWatcher(files);
  } else {
    // Single build mode
    await runBuild(files);
  }
})();

