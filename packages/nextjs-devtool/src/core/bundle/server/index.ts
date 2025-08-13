/**
 * Bundle Core Plugin Server Implementation
 * 
 * Implements the server-side procedures for bundle inspection functionality.
 * Provides access to build metadata, asset analysis, and dependency information.
 */

import type { BundleVersion, BundleAsset, BundleAnalysis } from '../shared/contract';

/**
 * Type for ORPC procedure implementation
 */
type Procedure = (...args: any[]) => Promise<any>;

/**
 * Simple ORPC Router interface following specification
 */
interface ORPCRouter {
  procedures: Record<string, Procedure>;
  merge: (prefix: string, router: ORPCRouter) => ORPCRouter;
  procedure: (name: string, impl: Procedure) => ORPCRouter;
}

/**
 * Create a simple router implementation
 */
function createRouter(): ORPCRouter {
  const procedures: Record<string, Procedure> = {};
  
  return {
    procedures,
    procedure(name: string, impl: Procedure) {
      procedures[name] = impl;
      return this;
    },
    merge(prefix: string, router: ORPCRouter) {
      Object.entries(router.procedures).forEach(([key, proc]) => {
        procedures[`${prefix}${key}`] = proc;
      });
      return this;
    },
  };
}

/**
 * Mock build metadata - in a real implementation this would read from build artifacts
 */
const getBuildMetadata = (): BundleVersion => {
  return {
    commit: process.env.GIT_COMMIT || 'abc123456',
    buildTime: Date.now(),
    version: process.env.npm_package_version || '1.0.0',
    environment: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  };
};

/**
 * Mock asset information - in a real implementation this would analyze webpack stats
 */
const getAssetList = (): string[] => {
  return [
    'main.js',
    'vendor.js', 
    'polyfills.js',
    'styles.css',
    'manifest.json',
  ];
};

/**
 * Mock detailed asset information
 */
const getAssetInfo = (assetName: string): BundleAsset => {
  const mockAssets: Record<string, BundleAsset> = {
    'main.js': {
      name: 'main.js',
      size: 245760,
      type: 'js',
      chunks: ['main'],
      gzipSize: 82560,
    },
    'vendor.js': {
      name: 'vendor.js', 
      size: 512000,
      type: 'js',
      chunks: ['vendor'],
      gzipSize: 128000,
    },
    'styles.css': {
      name: 'styles.css',
      size: 45120,
      type: 'css',
      chunks: ['main'],
      gzipSize: 12800,
    },
    'polyfills.js': {
      name: 'polyfills.js',
      size: 89600,
      type: 'js', 
      chunks: ['polyfills'],
      gzipSize: 32000,
    },
    'manifest.json': {
      name: 'manifest.json',
      size: 2048,
      type: 'other',
      chunks: [],
    },
  };

  return mockAssets[assetName] || {
    name: assetName,
    size: 0,
    type: 'other',
    chunks: [],
  };
};

/**
 * Mock bundle analysis
 */
const performBundleAnalysis = (): BundleAnalysis => {
  const assets = getAssetList().map(getAssetInfo);
  
  return {
    totalSize: assets.reduce((sum, asset) => sum + asset.size, 0),
    assets,
    chunks: {
      main: {
        size: 245760 + 45120,
        assets: ['main.js', 'styles.css'],
        modules: 156,
      },
      vendor: {
        size: 512000,
        assets: ['vendor.js'],
        modules: 89,
      },
      polyfills: {
        size: 89600,
        assets: ['polyfills.js'],
        modules: 12,
      },
    },
    dependencies: getDependencyList(),
  };
};

/**
 * Mock dependency information - in a real implementation this would read package.json
 */
const getDependencyList = (): Record<string, string> => {
  return {
    'react': '^18.2.0',
    'react-dom': '^18.2.0',
    'next': '^15.1.0',
    '@orpc/client': '^1.7.8',
    '@orpc/contract': '^1.7.8',
    'zod': '^3.22.0',
    'zustand': '^4.4.7',
  };
};

/**
 * Bundle Core Router Implementation following specification pattern
 */
export const bundleCoreRouter = createRouter()
  .procedure('version', async () => getBuildMetadata())
  .procedure('listAssets', async () => getAssetList())
  .procedure('getAssetDetails', async (_ctx: any, assetName: string) => getAssetInfo(assetName))
  .procedure('analyzeBundles', async () => performBundleAnalysis())
  .procedure('getDependencies', async () => getDependencyList());

export type BundleCoreRouter = typeof bundleCoreRouter;
