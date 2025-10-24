#!/usr/bin/env bun
/**
 * Build script for @repo/build-system
 * This script builds the build-system package using Bun's build API
 */

import { buildConfig } from './build.config';
import { rmSync, existsSync } from 'fs';
import { resolve } from 'path';

const packageRoot = import.meta.dir;

async function build() {
  console.log('🔨 Building @repo/build-system...\n');

  // Clean dist directory if it exists
  const distPath = resolve(packageRoot, buildConfig.outDir);
  if (existsSync(distPath)) {
    console.log('🧹 Cleaning dist directory...');
    rmSync(distPath, { recursive: true, force: true });
  }

  const startTime = Date.now();

  try {
    // Build using Bun's native build API
    const result = await Bun.build({
      entrypoints: buildConfig.entryPoints.map(entry => resolve(packageRoot, entry)),
      outdir: distPath,
      format: buildConfig.builderOptions.format as 'esm',
      target: buildConfig.builderOptions.target as 'node',
      sourcemap: buildConfig.builderOptions.sourcemap as 'external',
      minify: buildConfig.builderOptions.minify,
      splitting: buildConfig.builderOptions.splitting,
      external: buildConfig.builderOptions.external,
    });

    if (!result.success) {
      console.error('❌ Build failed:');
      for (const log of result.logs) {
        console.error(log);
      }
      process.exit(1);
    }

    const duration = Date.now() - startTime;
    console.log(`\n✅ Build completed successfully in ${duration}ms`);
    console.log(`📦 ${result.outputs.length} files generated in ${buildConfig.outDir}/`);
    
    // List generated files
    for (const output of result.outputs) {
      const relativePath = output.path.replace(packageRoot + '/', '');
      const sizeKB = (output.size / 1024).toFixed(2);
      console.log(`   - ${relativePath} (${sizeKB} KB)`);
    }
  } catch (error) {
    console.error('❌ Build failed with error:', error);
    process.exit(1);
  }
}

// Run the build
build();
