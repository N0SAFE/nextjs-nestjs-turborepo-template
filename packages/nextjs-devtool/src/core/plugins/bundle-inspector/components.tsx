/**
 * Bundle Inspector React Components
 * 
 * Type-safe React components for visualizing webpack bundle analysis,
 * chunk dependencies, and optimization recommendations.
 */

import React, { useState, useMemo, useCallback } from 'react';
import type {
  BundleAnalysis,
  BundleChunk,
  BundleModule,
  BundleFilter,
  BundleComparison,
} from './contract';

/**
 * Props for BundleInspectorPanel component
 */
export interface BundleInspectorPanelProps {
  readonly analysis: BundleAnalysis | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly onRefresh: () => Promise<void>;
  readonly onFilterChange: (filter: BundleFilter) => void;
  readonly onChunkSelect: (chunkId: string) => void;
  readonly onModuleSelect: (moduleId: string) => void;
}

/**
 * Main Bundle Inspector Panel Component
 */
export const BundleInspectorPanel: React.FC<BundleInspectorPanelProps> = ({
  analysis,
  isLoading,
  error,
  onRefresh,
  onFilterChange,
  onChunkSelect,
  onModuleSelect,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'chunks' | 'modules' | 'optimization'>('overview');
  const [filter, setFilter] = useState<BundleFilter>({});

  const handleFilterChange = useCallback((newFilter: BundleFilter) => {
    setFilter(newFilter);
    onFilterChange(newFilter);
  }, [onFilterChange]);

  const handleTabChange = useCallback((tab: typeof activeTab) => {
    setActiveTab(tab);
  }, []);

  if (error) {
    return (
      <div className="bundle-inspector-error">
        <h3>Bundle Analysis Error</h3>
        <p>{error}</p>
        <button onClick={onRefresh}>Retry Analysis</button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bundle-inspector-loading">
        <p>Analyzing bundle...</p>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bundle-inspector-empty">
        <h3>No Bundle Analysis Available</h3>
        <p>Run a bundle analysis to view webpack bundle information.</p>
        <button onClick={onRefresh}>Start Analysis</button>
      </div>
    );
  }

  return (
    <div className="bundle-inspector-panel">
      <div className="bundle-inspector-header">
        <h2>Bundle Inspector</h2>
        <div className="bundle-inspector-actions">
          <button onClick={onRefresh} disabled={isLoading}>
            Refresh Analysis
          </button>
        </div>
      </div>

      <div className="bundle-inspector-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'chunks' ? 'active' : ''}`}
          onClick={() => handleTabChange('chunks')}
        >
          Chunks ({analysis.chunkCount})
        </button>
        <button
          className={`tab ${activeTab === 'modules' ? 'active' : ''}`}
          onClick={() => handleTabChange('modules')}
        >
          Modules ({analysis.moduleCount})
        </button>
        <button
          className={`tab ${activeTab === 'optimization' ? 'active' : ''}`}
          onClick={() => handleTabChange('optimization')}
        >
          Optimization
        </button>
      </div>

      <div className="bundle-inspector-content">
        {activeTab === 'overview' && (
          <BundleOverview analysis={analysis} />
        )}
        {activeTab === 'chunks' && (
          <ChunkList
            chunks={analysis.largestChunks}
            filter={filter}
            onFilterChange={handleFilterChange}
            onChunkSelect={onChunkSelect}
          />
        )}
        {activeTab === 'modules' && (
          <ModuleList
            modules={analysis.largestModules}
            filter={filter}
            onFilterChange={handleFilterChange}
            onModuleSelect={onModuleSelect}
          />
        )}
        {activeTab === 'optimization' && (
          <OptimizationPanel suggestions={analysis.optimizationSuggestions} />
        )}
      </div>
    </div>
  );
};

/**
 * Props for BundleOverview component
 */
export interface BundleOverviewProps {
  readonly analysis: BundleAnalysis;
}

/**
 * Bundle Overview Component
 */
export const BundleOverview: React.FC<BundleOverviewProps> = ({ analysis }) => {
  const formatSize = useCallback((bytes: number): string => {
    if (bytes === 0) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i] ?? 'B'}`;
  }, []);

  const compressionRatio = useMemo(() => {
    if (analysis.totalSize === 0) {
      return 0;
    }
    return ((analysis.totalSize - analysis.totalGzipSize) / analysis.totalSize) * 100;
  }, [analysis.totalSize, analysis.totalGzipSize]);

  return (
    <div className="bundle-overview">
      <div className="bundle-stats">
        <div className="stat-card">
          <h3>Total Size</h3>
          <p className="stat-value">{formatSize(analysis.totalSize)}</p>
        </div>
        <div className="stat-card">
          <h3>Gzipped Size</h3>
          <p className="stat-value">{formatSize(analysis.totalGzipSize)}</p>
          <p className="stat-detail">{compressionRatio.toFixed(1)}% compression</p>
        </div>
        <div className="stat-card">
          <h3>Chunks</h3>
          <p className="stat-value">{analysis.chunkCount}</p>
        </div>
        <div className="stat-card">
          <h3>Modules</h3>
          <p className="stat-value">{analysis.moduleCount}</p>
        </div>
      </div>

      {analysis.duplicateModules.length > 0 && (
        <div className="duplicate-modules">
          <h3>Duplicate Modules ({analysis.duplicateModules.length})</h3>
          <ul>
            {analysis.duplicateModules.map((module) => (
              <li key={module}>{module}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="quick-insights">
        <h3>Quick Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Largest Chunk</h4>
            <p>{analysis.largestChunks[0]?.name ?? 'N/A'}</p>
            <p>{formatSize(analysis.largestChunks[0]?.size ?? 0)}</p>
          </div>
          <div className="insight-card">
            <h4>Optimization Opportunities</h4>
            <p>{analysis.optimizationSuggestions.length} suggestions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Props for ChunkList component
 */
export interface ChunkListProps {
  readonly chunks: readonly BundleChunk[];
  readonly filter: BundleFilter;
  readonly onFilterChange: (filter: BundleFilter) => void;
  readonly onChunkSelect: (chunkId: string) => void;
}

/**
 * Chunk List Component
 */
export const ChunkList: React.FC<ChunkListProps> = ({
  chunks,
  filter,
  onFilterChange,
  onChunkSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState(filter.searchQuery ?? '');
  const [sortBy, setSortBy] = useState(filter.sortBy ?? 'size');
  const [sortOrder, setSortOrder] = useState(filter.sortOrder ?? 'desc');

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    onFilterChange({ ...filter, searchQuery: value });
  }, [filter, onFilterChange]);

  const handleSortChange = useCallback((field: NonNullable<BundleFilter['sortBy']>) => {
    const newOrder = field === sortBy && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(field);
    setSortOrder(newOrder);
    onFilterChange({ ...filter, sortBy: field, sortOrder: newOrder });
  }, [filter, onFilterChange, sortBy, sortOrder]);

  const formatSize = useCallback((bytes: number): string => {
    if (bytes === 0) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i] ?? 'B'}`;
  }, []);

  return (
    <div className="chunk-list">
      <div className="chunk-list-controls">
        <input
          type="text"
          placeholder="Search chunks..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <div className="chunk-table">
        <div className="chunk-table-header">
          <button
            className={`sort-button ${sortBy === 'name' ? `sorted-${sortOrder}` : ''}`}
            onClick={() => handleSortChange('name')}
          >
            Name
          </button>
          <button
            className={`sort-button ${sortBy === 'size' ? `sorted-${sortOrder}` : ''}`}
            onClick={() => handleSortChange('size')}
          >
            Size
          </button>
          <button
            className={`sort-button ${sortBy === 'type' ? `sorted-${sortOrder}` : ''}`}
            onClick={() => handleSortChange('type')}
          >
            Type
          </button>
          <span>Modules</span>
        </div>

        <div className="chunk-table-body">
          {chunks.map((chunk) => (
            <div
              key={chunk.id}
              className="chunk-row"
              onClick={() => onChunkSelect(chunk.id)}
            >
              <span className="chunk-name">{chunk.name}</span>
              <span className="chunk-size">{formatSize(chunk.size)}</span>
              <span className={`chunk-type type-${chunk.type}`}>{chunk.type}</span>
              <span className="chunk-modules">{chunk.modules.length}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Props for ModuleList component
 */
export interface ModuleListProps {
  readonly modules: readonly BundleModule[];
  readonly filter: BundleFilter;
  readonly onFilterChange: (filter: BundleFilter) => void;
  readonly onModuleSelect: (moduleId: string) => void;
}

/**
 * Module List Component
 */
export const ModuleList: React.FC<ModuleListProps> = ({
  modules,
  filter,
  onFilterChange,
  onModuleSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState(filter.searchQuery ?? '');

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    onFilterChange({ ...filter, searchQuery: value });
  }, [filter, onFilterChange]);

  const formatSize = useCallback((bytes: number): string => {
    if (bytes === 0) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i] ?? 'B'}`;
  }, []);

  return (
    <div className="module-list">
      <div className="module-list-controls">
        <input
          type="text"
          placeholder="Search modules..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <div className="module-table">
        <div className="module-table-header">
          <span>Name</span>
          <span>Size</span>
          <span>Type</span>
          <span>Chunks</span>
        </div>

        <div className="module-table-body">
          {modules.map((module) => (
            <div
              key={module.id}
              className="module-row"
              onClick={() => onModuleSelect(module.id)}
            >
              <span className="module-name" title={module.path}>
                {module.name}
              </span>
              <span className="module-size">{formatSize(module.size)}</span>
              <span className={`module-type type-${module.type}`}>{module.type}</span>
              <span className="module-chunks">{module.chunks.length}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Props for OptimizationPanel component
 */
export interface OptimizationPanelProps {
  readonly suggestions: readonly BundleAnalysis['optimizationSuggestions'][number][];
}

/**
 * Optimization Panel Component
 */
export const OptimizationPanel: React.FC<OptimizationPanelProps> = ({ suggestions }) => {
  const formatSize = useCallback((bytes: number): string => {
    if (bytes === 0) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i] ?? 'B'}`;
  }, []);

  const totalSavings = useMemo(() => {
    return suggestions.reduce((total, suggestion) => total + suggestion.impact.sizeReduction, 0);
  }, [suggestions]);

  if (suggestions.length === 0) {
    return (
      <div className="optimization-panel">
        <div className="no-suggestions">
          <h3>Great Job!</h3>
          <p>No optimization opportunities found. Your bundle is well optimized.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="optimization-panel">
      <div className="optimization-summary">
        <h3>Optimization Opportunities</h3>
        <p>Total potential savings: <strong>{formatSize(totalSavings)}</strong></p>
      </div>

      <div className="suggestions-list">
        {suggestions.map((suggestion, index) => (
          <div key={index} className={`suggestion-card suggestion-${suggestion.type}`}>
            <div className="suggestion-header">
              <h4>{suggestion.type.replace('-', ' ').toUpperCase()}</h4>
              <div className="suggestion-impact">
                <span className="size-reduction">-{formatSize(suggestion.impact.sizeReduction)}</span>
                <span className="performance-gain">+{suggestion.impact.performanceGain}%</span>
              </div>
            </div>
            <div className="suggestion-body">
              <p>{suggestion.description}</p>
              {suggestion.modules && suggestion.modules.length > 0 && (
                <div className="affected-modules">
                  <h5>Affected modules:</h5>
                  <ul>
                    {suggestion.modules.slice(0, 5).map((module) => (
                      <li key={module}>{module}</li>
                    ))}
                    {suggestion.modules.length > 5 && (
                      <li>... and {suggestion.modules.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
