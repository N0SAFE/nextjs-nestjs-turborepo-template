#!/usr/bin/env bun
/**
 * Build script for @repo/build-system
 * This script uses the build-system's own CLI to build itself (dogfooding)
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function build() {
  console.log('🔨 Building @repo/build-system using its own CLI...\n');

  const startTime = Date.now();

  try {
    // First, compile the TypeScript source using tsc to generate the CLI
    console.log('📝 Step 1: Compiling TypeScript source with tsc...');
    const tscResult = await execAsync('bun x tsc -p tsconfig.build.json', {
      cwd: import.meta.dir,
    });
    
    if (tscResult.stdout) console.log(tscResult.stdout);
    if (tscResult.stderr) console.error(tscResult.stderr);

    // Now use the built CLI to build the package
    console.log('\n🔄 Step 2: Building using build-system CLI...');
    const buildResult = await execAsync('node dist/cli.js build . --clean', {
      cwd: import.meta.dir,
    });
    
    if (buildResult.stdout) console.log(buildResult.stdout);
    if (buildResult.stderr) console.error(buildResult.stderr);

    const duration = Date.now() - startTime;
    console.log(`\n✅ Self-build completed successfully in ${duration}ms`);
    console.log('🎉 The build-system built itself using its own CLI!');
  } catch (error) {
    console.error('❌ Build failed with error:', error);
    process.exit(1);
  }
}

// Run the build
build();
