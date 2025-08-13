/**
 * Bundle Core Plugin Contract
 * 
 * Defines the ORPC contract for bundle inspection functionality
 * including build metadata, asset analysis, and version information.
 */

import { oc } from '@orpc/contract';
import { z } from 'zod';

/**
 * Bundle version information schema
 */
const BundleVersionSchema = z.object({
  commit: z.string().describe('Git commit hash'),
  buildTime: z.number().describe('Build timestamp'),
  version: z.string().optional().describe('Package version'),
  environment: z.enum(['development', 'production', 'test']).describe('Build environment'),
});

/**
 * Bundle asset information schema
 */
const BundleAssetSchema = z.object({
  name: z.string().describe('Asset filename'),
  size: z.number().describe('Asset size in bytes'),
  type: z.enum(['js', 'css', 'html', 'image', 'font', 'other']).describe('Asset type'),
  chunks: z.array(z.string()).optional().describe('Associated webpack chunks'),
  gzipSize: z.number().optional().describe('Gzipped size in bytes'),
});

/**
 * Bundle analysis schema
 */
const BundleAnalysisSchema = z.object({
  totalSize: z.number().describe('Total bundle size in bytes'),
  assets: z.array(BundleAssetSchema).describe('List of all assets'),
  chunks: z.record(z.string(), z.object({
    size: z.number(),
    assets: z.array(z.string()),
    modules: z.number(),
  })).describe('Webpack chunk information'),
  dependencies: z.record(z.string(), z.string()).describe('Package dependencies with versions'),
});

/**
 * Individual procedure contracts
 */
export const versionContract = oc
  .route({
    method: "GET",
    path: "/version",
    summary: "Get build version",
    description: "Get build version and metadata",
  })
  .input(z.object({}))
  .output(BundleVersionSchema);

export const listAssetsContract = oc
  .route({
    method: "GET", 
    path: "/assets",
    summary: "List assets",
    description: "List all bundle assets",
  })
  .input(z.object({}))
  .output(z.array(z.string()));

export const getAssetDetailsContract = oc
  .route({
    method: "GET",
    path: "/assets/:assetName",
    summary: "Get asset details",
    description: "Get detailed information about a specific asset",
  })
  .input(z.object({
    assetName: z.string().describe('Name of the asset to analyze'),
  }))
  .output(BundleAssetSchema);

export const analyzeBundlesContract = oc
  .route({
    method: "GET",
    path: "/analyze",
    summary: "Analyze bundles",
    description: "Perform complete bundle analysis",
  })
  .input(z.object({}))
  .output(BundleAnalysisSchema);

export const getDependenciesContract = oc
  .route({
    method: "GET",
    path: "/dependencies",
    summary: "Get dependencies",
    description: "Get all package dependencies with versions",
  })
  .input(z.object({}))
  .output(z.record(z.string(), z.string()));

/**
 * Bundle Core Plugin Contract
 * 
 * Namespace: core.bundle.*
 */
export const bundleContract = oc.tag("Bundle").prefix("/bundle").router({
  version: versionContract,
  listAssets: listAssetsContract,
  getAssetDetails: getAssetDetailsContract,
  analyzeBundles: analyzeBundlesContract,
  getDependencies: getDependenciesContract,
});

/**
 * Type exports for use in components and hooks
 */
export type BundleVersion = z.infer<typeof BundleVersionSchema>;
export type BundleAsset = z.infer<typeof BundleAssetSchema>;
export type BundleAnalysis = z.infer<typeof BundleAnalysisSchema>;
export type BundleContract = typeof bundleContract;
