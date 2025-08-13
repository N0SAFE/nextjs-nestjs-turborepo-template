/**
 * Bundle Inspector Custom Hooks
 * 
 * Type-safe React hooks for bundle analysis data fetching,
 * state management, and user interactions.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  BundleAnalysis,
  BundleChunk,
  BundleModule,
  BundleFilter,
  BundleComparison,
} from './contract';

/**
 * Configuration for bundle analysis hooks
 */
export interface BundleAnalysisConfig {
  readonly autoRefresh?: boolean;
  readonly refreshInterval?: number;
  readonly enableCaching?: boolean;
  readonly maxCacheAge?: number;
}

/**
 * Bundle analysis state
 */
export interface BundleAnalysisState {
  readonly analysis: BundleAnalysis | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly lastUpdated: number | null;
  readonly isRefreshing: boolean;
}

/**
 * Bundle filter state
 */
export interface BundleFilterState {
  readonly filter: BundleFilter;
  readonly filteredChunks: readonly BundleChunk[];
  readonly filteredModules: readonly BundleModule[];
  readonly totalCount: number;
  readonly filteredCount: number;
}

/**
 * Hook for managing bundle analysis
 */
export function useBundleAnalysis(config: BundleAnalysisConfig = {}): BundleAnalysisState & {
  readonly refresh: () => Promise<void>;
  readonly clearError: () => void;
} {
  const [state, setState] = useState<BundleAnalysisState>({
    analysis: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
    isRefreshing: false,
  });

  const {
    autoRefresh = false,
    refreshInterval = 30000,
    enableCaching = true,
    maxCacheAge = 300000, // 5 minutes
  } = config;

  // Simulated API call - in real implementation, this would use ORPC client
  const fetchAnalysis = useCallback(async (): Promise<BundleAnalysis> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data for demonstration
    const mockAnalysis: BundleAnalysis = {
      totalSize: 2048576, // 2MB
      totalGzipSize: 512000, // 500KB
      chunkCount: 8,
      moduleCount: 150,
      duplicateModules: ['lodash', 'moment'],
      largestChunks: [
        {
          id: 'main',
          name: 'main',
          size: 1024000,
          gzipSize: 256000,
          modules: ['main.js', 'app.js'],
          dependencies: [],
          type: 'entry',
        },
        {
          id: 'vendor',
          name: 'vendor',
          size: 512000,
          gzipSize: 128000,
          modules: ['react', 'react-dom'],
          dependencies: [],
          type: 'vendor',
        },
      ],
      largestModules: [
        {
          id: 'react',
          name: 'react',
          path: 'node_modules/react/index.js',
          size: 256000,
          chunks: ['vendor'],
          dependencies: [],
          dependents: ['app.js'],
          type: 'node_modules',
          isAsync: false,
        },
      ],
      optimizationSuggestions: [
        {
          type: 'split-chunk',
          description: 'Split vendor chunk to improve caching',
          impact: {
            sizeReduction: 100000,
            performanceGain: 15,
          },
          modules: ['react', 'react-dom'],
        },
      ],
      analysisTime: 2500,
      timestamp: Date.now(),
    };

    return mockAnalysis;
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, isRefreshing: true, error: null }));

    try {
      const analysis = await fetchAnalysis();
      setState(prev => ({
        ...prev,
        analysis,
        isLoading: false,
        isRefreshing: false,
        lastUpdated: Date.now(),
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bundle analysis',
      }));
    }
  }, [fetchAnalysis]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initial load
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) {
      return;
    }

    const interval = setInterval(() => {
      if (!state.isLoading) {
        void refresh();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, state.isLoading, refresh]);

  return {
    ...state,
    refresh,
    clearError,
  };
}

/**
 * Hook for filtering bundle chunks and modules
 */
export function useBundleFilter(
  analysis: BundleAnalysis | null,
  initialFilter: BundleFilter = {}
): BundleFilterState & {
  readonly updateFilter: (filter: Partial<BundleFilter>) => void;
  readonly resetFilter: () => void;
} {
  const [filter, setFilter] = useState<BundleFilter>(initialFilter);

  const filteredData = useMemo(() => {
    if (!analysis) {
      return {
        filteredChunks: [],
        filteredModules: [],
        totalCount: 0,
        filteredCount: 0,
      };
    }

    // Filter chunks
    let chunks = [...analysis.largestChunks];
    
    if (filter.chunkTypes && filter.chunkTypes.length > 0) {
      chunks = chunks.filter(chunk => filter.chunkTypes?.includes(chunk.type));
    }
    
    if (filter.minSize !== undefined) {
      chunks = chunks.filter(chunk => chunk.size >= filter.minSize!);
    }
    
    if (filter.maxSize !== undefined) {
      chunks = chunks.filter(chunk => chunk.size <= filter.maxSize!);
    }
    
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      chunks = chunks.filter(chunk => 
        chunk.name.toLowerCase().includes(query) ||
        chunk.modules.some(module => module.toLowerCase().includes(query))
      );
    }

    // Sort chunks
    if (filter.sortBy) {
      chunks.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;
        
        switch (filter.sortBy) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'size':
            aValue = a.size;
            bValue = b.size;
            break;
          case 'type':
            aValue = a.type;
            bValue = b.type;
            break;
          case 'loadTime':
            aValue = a.loadTime ?? 0;
            bValue = b.loadTime ?? 0;
            break;
          default:
            aValue = a.size;
            bValue = b.size;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return filter.sortOrder === 'desc' 
            ? bValue.localeCompare(aValue)
            : aValue.localeCompare(bValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return filter.sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
        }

        return 0;
      });
    }

    // Filter modules
    let modules = [...analysis.largestModules];
    
    if (filter.moduleTypes && filter.moduleTypes.length > 0) {
      modules = modules.filter(module => filter.moduleTypes?.includes(module.type));
    }
    
    if (filter.minSize !== undefined) {
      modules = modules.filter(module => module.size >= filter.minSize!);
    }
    
    if (filter.maxSize !== undefined) {
      modules = modules.filter(module => module.size <= filter.maxSize!);
    }
    
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      modules = modules.filter(module => 
        module.name.toLowerCase().includes(query) ||
        module.path.toLowerCase().includes(query)
      );
    }

    return {
      filteredChunks: chunks,
      filteredModules: modules,
      totalCount: analysis.largestChunks.length + analysis.largestModules.length,
      filteredCount: chunks.length + modules.length,
    };
  }, [analysis, filter]);

  const updateFilter = useCallback((newFilter: Partial<BundleFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  }, []);

  const resetFilter = useCallback(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  return {
    filter,
    ...filteredData,
    updateFilter,
    resetFilter,
  };
}

/**
 * Hook for bundle chunk details
 */
export function useBundleChunk(chunkId: string | null): {
  readonly chunk: BundleChunk | null;
  readonly dependencies: readonly BundleChunk[];
  readonly modules: readonly BundleModule[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly loadChunk: (id: string) => Promise<void>;
} {
  const [state, setState] = useState<{
    readonly chunk: BundleChunk | null;
    readonly dependencies: readonly BundleChunk[];
    readonly modules: readonly BundleModule[];
    readonly isLoading: boolean;
    readonly error: string | null;
  }>({
    chunk: null,
    dependencies: [],
    modules: [],
    isLoading: false,
    error: null,
  });

  const loadChunk = useCallback(async (id: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock chunk data
      const mockChunk: BundleChunk = {
        id,
        name: id,
        size: 1024000,
        gzipSize: 256000,
        modules: ['main.js', 'app.js'],
        dependencies: [],
        type: 'entry',
      };

      setState(prev => ({
        ...prev,
        chunk: mockChunk,
        dependencies: [],
        modules: [],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load chunk details',
      }));
    }
  }, []);

  useEffect(() => {
    if (chunkId) {
      void loadChunk(chunkId);
    }
  }, [chunkId, loadChunk]);

  return {
    ...state,
    loadChunk,
  };
}

/**
 * Hook for bundle module details
 */
export function useBundleModule(moduleId: string | null): {
  readonly module: BundleModule | null;
  readonly dependencies: readonly BundleModule[];
  readonly dependents: readonly BundleModule[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly loadModule: (id: string) => Promise<void>;
} {
  const [state, setState] = useState<{
    readonly module: BundleModule | null;
    readonly dependencies: readonly BundleModule[];
    readonly dependents: readonly BundleModule[];
    readonly isLoading: boolean;
    readonly error: string | null;
  }>({
    module: null,
    dependencies: [],
    dependents: [],
    isLoading: false,
    error: null,
  });

  const loadModule = useCallback(async (id: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock module data
      const mockModule: BundleModule = {
        id,
        name: id,
        path: `node_modules/${id}/index.js`,
        size: 256000,
        chunks: ['vendor'],
        dependencies: [],
        dependents: [],
        type: 'node_modules',
        isAsync: false,
      };

      setState(prev => ({
        ...prev,
        module: mockModule,
        dependencies: [],
        dependents: [],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load module details',
      }));
    }
  }, []);

  useEffect(() => {
    if (moduleId) {
      void loadModule(moduleId);
    }
  }, [moduleId, loadModule]);

  return {
    ...state,
    loadModule,
  };
}

/**
 * Hook for bundle comparison functionality
 */
export function useBundleComparison(): {
  readonly comparison: BundleComparison | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly compare: (baselineId: string, currentId?: string) => Promise<void>;
  readonly clearComparison: () => void;
} {
  const [state, setState] = useState<{
    readonly comparison: BundleComparison | null;
    readonly isLoading: boolean;
    readonly error: string | null;
  }>({
    comparison: null,
    isLoading: false,
    error: null,
  });

  const compare = useCallback(async (baselineId: string, currentId?: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock comparison data would be generated here
      // This is just a placeholder implementation
      
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to compare bundles',
      }));
    }
  }, []);

  const clearComparison = useCallback(() => {
    setState(prev => ({ ...prev, comparison: null, error: null }));
  }, []);

  return {
    ...state,
    compare,
    clearComparison,
  };
}

/**
 * Hook for bundle optimization suggestions
 */
export function useBundleOptimization(): {
  readonly optimizationReport: {
    readonly totalPotentialSavings: number;
    readonly totalPerformanceGain: number;
    readonly recommendations: ReadonlyArray<{
      readonly priority: 'high' | 'medium' | 'low';
      readonly category: 'size' | 'performance' | 'maintainability';
      readonly title: string;
      readonly description: string;
      readonly implementation: string;
      readonly impact: {
        readonly sizeReduction: number;
        readonly performanceGain: number;
        readonly implementationCost: 'low' | 'medium' | 'high';
      };
      readonly affectedModules: readonly string[];
    }>;
  } | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly generateReport: () => Promise<void>;
} {
  const [state, setState] = useState<{
    readonly optimizationReport: ReturnType<typeof useBundleOptimization>['optimizationReport'];
    readonly isLoading: boolean;
    readonly error: string | null;
  }>({
    optimizationReport: null,
    isLoading: false,
    error: null,
  });

  const generateReport = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock optimization report
      const mockReport = {
        totalPotentialSavings: 500000,
        totalPerformanceGain: 25,
        recommendations: [
          {
            priority: 'high' as const,
            category: 'size' as const,
            title: 'Split vendor chunks',
            description: 'Separate vendor libraries into their own chunks for better caching',
            implementation: 'Configure webpack splitChunks optimization',
            impact: {
              sizeReduction: 200000,
              performanceGain: 15,
              implementationCost: 'low' as const,
            },
            affectedModules: ['react', 'react-dom', 'lodash'],
          },
        ],
      };

      setState(prev => ({
        ...prev,
        optimizationReport: mockReport,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate optimization report',
      }));
    }
  }, []);

  return {
    ...state,
    generateReport,
  };
}
