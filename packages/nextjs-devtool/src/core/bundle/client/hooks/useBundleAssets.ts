/**
 * Bundle Assets Hook
 * 
 * Custom hook to fetch bundle asset information
 */

import { useState, useEffect } from 'react';
import type { BundleAsset } from '@repo/nextjs-devtool/core/bundle/shared/contract';

/**
 * Hook to get bundle asset list
 */
export function useBundleAssets() {
  const [assets, setAssets] = useState<BundleAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Mock API call - in real implementation this would use useDevTool<BundleContract>().orpc.analyzeBundles()
    const fetchAssets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const mockAssets: BundleAsset[] = [
          {
            name: 'main.js',
            size: 245760,
            type: 'js',
            chunks: ['main'],
            gzipSize: 82560,
          },
          {
            name: 'vendor.js',
            size: 512000,
            type: 'js',
            chunks: ['vendor'],
            gzipSize: 128000,
          },
          {
            name: 'styles.css',
            size: 45120,
            type: 'css',
            chunks: ['main'],
            gzipSize: 12800,
          },
        ];
        
        setAssets(mockAssets);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch assets');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  return {
    assets,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      setError(null);
    },
  };
}
