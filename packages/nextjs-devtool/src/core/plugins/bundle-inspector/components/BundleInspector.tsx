/**
 * Bundle Inspector Main Component
 * 
 * Provides comprehensive webpack bundle analysis interface with
 * chunk visualization, module dependencies, and optimization insights.
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { BundleAnalysis, BundleChunk, BundleModule, BundleFilter } from '../contract';

/**
 * Props for the BundleInspector component
 */
interface BundleInspectorProps {
  /**
   * Current bundle analysis data
   */
  readonly analysis: BundleAnalysis | null;
  
  /**
   * Loading state for analysis refresh
   */
  readonly isLoading: boolean;
  
  /**
   * Error state
   */
  readonly error: string | null;
  
  /**
   * Callback to refresh bundle analysis
   */
  readonly onRefreshAnalysis: (force?: boolean) => Promise<void>;
  
  /**
   * Callback to fetch filtered chunks
   */
  readonly onGetChunks: (filter?: BundleFilter) => Promise<{ chunks: BundleChunk[]; totalCount: number; filteredCount: number }>;
  
  /**
   * Callback to fetch filtered modules
   */
  readonly onGetModules: (filter?: BundleFilter) => Promise<{ modules: BundleModule[]; totalCount: number; filteredCount: number }>;
  
  /**
   * Callback to get module dependencies
   */
  readonly onGetModuleDependencies: (moduleId: string) => Promise<{
    module: BundleModule;
    dependencies: BundleModule[];
    dependents: BundleModule[];
    dependencyGraph: Record<string, string[]>;
  }>;
  
  /**
   * Optional className for styling
   */
  readonly className?: string;
}

/**
 * Tab types for the bundle inspector interface
 */
type InspectorTab = 'overview' | 'chunks' | 'modules' | 'dependencies' | 'optimization';

/**
 * Bundle Inspector Component
 * 
 * Provides a comprehensive interface for analyzing webpack bundles,
 * including size analysis, dependency visualization, and optimization suggestions.
 */
export const BundleInspector: React.FC<BundleInspectorProps> = ({
  analysis,
  isLoading,
  error,
  onRefreshAnalysis,
  onGetChunks,
  onGetModules,
  onGetModuleDependencies,
  className = '',
}) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<InspectorTab>('overview');
  
  // State for filter options
  const [chunkFilter, setChunkFilter] = useState<BundleFilter>({});
  const [moduleFilter, setModuleFilter] = useState<BundleFilter>({});
  
  // State for selected item details
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  
  /**
   * Handle tab change
   */
  const handleTabChange = useCallback((tab: InspectorTab) => {
    setActiveTab(tab);
  }, []);
  
  /**
   * Handle refresh with force option
   */
  const handleRefresh = useCallback(async (force: boolean = false) => {
    try {
      await onRefreshAnalysis(force);
    } catch (refreshError) {
      console.error('Failed to refresh analysis:', refreshError);
    }
  }, [onRefreshAnalysis]);
  
  /**
   * Format file size for display
   */
  const formatSize = useCallback((bytes: number): string => {
    if (bytes === 0) {
      return '0 B';
    }
    
    const units = ['B', 'KB', 'MB', 'GB'];
    const base = 1024;
    const index = Math.floor(Math.log(bytes) / Math.log(base));
    const size = bytes / Math.pow(base, index);
    
    return `${size.toFixed(1)} ${units[index]}`;
  }, []);
  
  /**
   * Calculate bundle health score
   */
  const bundleHealthScore = useMemo((): number => {
    if (!analysis) {
      return 0;
    }
    
    let score = 100;
    
    // Penalize large bundle size (over 500KB)
    if (analysis.totalSize > 500000) {
      score -= Math.min(30, (analysis.totalSize - 500000) / 100000 * 10);
    }
    
    // Penalize many chunks (over 10)
    if (analysis.chunkCount > 10) {
      score -= Math.min(20, (analysis.chunkCount - 10) * 2);
    }
    
    // Penalize duplicate modules
    score -= Math.min(25, analysis.duplicateModules.length * 5);
    
    return Math.max(0, Math.round(score));
  }, [analysis]);
  
  /**
   * Render error state
   */
  if (error) {
    return (
      <div className={`bundle-inspector bundle-inspector--error ${className}`}>
        <div className="bundle-inspector__error">
          <h3>Bundle Analysis Error</h3>
          <p>{error}</p>
          <button 
            onClick={() => handleRefresh(true)}
            disabled={isLoading}
            className="bundle-inspector__retry-button"
          >
            {isLoading ? 'Retrying...' : 'Retry Analysis'}
          </button>
        </div>
      </div>
    );
  }
  
  /**
   * Render loading state
   */
  if (isLoading && !analysis) {
    return (
      <div className={`bundle-inspector bundle-inspector--loading ${className}`}>
        <div className="bundle-inspector__loading">
          <div className="bundle-inspector__spinner" />
          <p>Analyzing bundle...</p>
        </div>
      </div>
    );
  }
  
  /**
   * Render no data state
   */
  if (!analysis) {
    return (
      <div className={`bundle-inspector bundle-inspector--no-data ${className}`}>
        <div className="bundle-inspector__no-data">
          <h3>No Bundle Data Available</h3>
          <p>Bundle analysis data is not available. Try building your application first.</p>
          <button 
            onClick={() => handleRefresh(true)}
            disabled={isLoading}
            className="bundle-inspector__analyze-button"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Bundle'}
          </button>
        </div>
      </div>
    );
  }
  
  /**
   * Render overview tab content
   */
  const renderOverviewTab = (): React.ReactElement => (
    <div className="bundle-inspector__overview">
      <div className="bundle-inspector__metrics">
        <div className="bundle-inspector__metric">
          <label>Total Size</label>
          <div className="bundle-inspector__metric-value">
            {formatSize(analysis.totalSize)}
          </div>
        </div>
        
        <div className="bundle-inspector__metric">
          <label>Gzip Size</label>
          <div className="bundle-inspector__metric-value">
            {formatSize(analysis.totalGzipSize)}
          </div>
        </div>
        
        <div className="bundle-inspector__metric">
          <label>Chunks</label>
          <div className="bundle-inspector__metric-value">
            {analysis.chunkCount}
          </div>
        </div>
        
        <div className="bundle-inspector__metric">
          <label>Modules</label>
          <div className="bundle-inspector__metric-value">
            {analysis.moduleCount}
          </div>
        </div>
        
        <div className="bundle-inspector__metric">
          <label>Health Score</label>
          <div className={`bundle-inspector__metric-value bundle-inspector__health-score--${
            bundleHealthScore >= 80 ? 'good' : bundleHealthScore >= 60 ? 'warning' : 'critical'
          }`}>
            {bundleHealthScore}%
          </div>
        </div>
      </div>
      
      {analysis.duplicateModules.length > 0 && (
        <div className="bundle-inspector__warnings">
          <h4>⚠️ Duplicate Modules Detected</h4>
          <ul>
            {analysis.duplicateModules.slice(0, 5).map((module) => (
              <li key={module}>{module}</li>
            ))}
          </ul>
          {analysis.duplicateModules.length > 5 && (
            <p>... and {analysis.duplicateModules.length - 5} more</p>
          )}
        </div>
      )}
      
      <div className="bundle-inspector__largest-chunks">
        <h4>Largest Chunks</h4>
        <ul>
          {analysis.largestChunks.slice(0, 5).map((chunk) => (
            <li key={chunk.id} className="bundle-inspector__chunk-item">
              <span className="bundle-inspector__chunk-name">{chunk.name}</span>
              <span className="bundle-inspector__chunk-size">{formatSize(chunk.size)}</span>
              <span className="bundle-inspector__chunk-type">{chunk.type}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="bundle-inspector__largest-modules">
        <h4>Largest Modules</h4>
        <ul>
          {analysis.largestModules.slice(0, 5).map((module) => (
            <li key={module.id} className="bundle-inspector__module-item">
              <span className="bundle-inspector__module-name">{module.name}</span>
              <span className="bundle-inspector__module-size">{formatSize(module.size)}</span>
              <span className="bundle-inspector__module-type">{module.type}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
  
  /**
   * Render optimization tab content
   */
  const renderOptimizationTab = (): React.ReactElement => (
    <div className="bundle-inspector__optimization">
      <h4>Optimization Suggestions</h4>
      {analysis.optimizationSuggestions.length === 0 ? (
        <p className="bundle-inspector__no-suggestions">
          🎉 Great! No optimization suggestions at this time.
        </p>
      ) : (
        <ul className="bundle-inspector__suggestions">
          {analysis.optimizationSuggestions.map((suggestion, index) => (
            <li key={index} className={`bundle-inspector__suggestion bundle-inspector__suggestion--${suggestion.type}`}>
              <div className="bundle-inspector__suggestion-header">
                <h5>{suggestion.type.replace('-', ' ').toUpperCase()}</h5>
                <div className="bundle-inspector__suggestion-impact">
                  <span>Size: -{formatSize(suggestion.impact.sizeReduction)}</span>
                  <span>Performance: +{(suggestion.impact.performanceGain * 100).toFixed(1)}%</span>
                </div>
              </div>
              <p className="bundle-inspector__suggestion-description">
                {suggestion.description}
              </p>
              {suggestion.modules && suggestion.modules.length > 0 && (
                <div className="bundle-inspector__suggestion-modules">
                  <strong>Affected modules:</strong>
                  <ul>
                    {suggestion.modules.slice(0, 3).map((module) => (
                      <li key={module}>{module}</li>
                    ))}
                  </ul>
                  {suggestion.modules.length > 3 && (
                    <span>... and {suggestion.modules.length - 3} more</span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  
  /**
   * Render tab navigation
   */
  const renderTabNavigation = (): React.ReactElement => (
    <nav className="bundle-inspector__tabs">
      {(['overview', 'chunks', 'modules', 'dependencies', 'optimization'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => handleTabChange(tab)}
          className={`bundle-inspector__tab ${activeTab === tab ? 'bundle-inspector__tab--active' : ''}`}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </nav>
  );
  
  /**
   * Render refresh controls
   */
  const renderRefreshControls = (): React.ReactElement => (
    <div className="bundle-inspector__controls">
      <button
        onClick={() => handleRefresh(false)}
        disabled={isLoading}
        className="bundle-inspector__refresh-button"
      >
        {isLoading ? '🔄 Refreshing...' : '🔄 Refresh'}
      </button>
      
      <button
        onClick={() => handleRefresh(true)}
        disabled={isLoading}
        className="bundle-inspector__force-refresh-button"
      >
        {isLoading ? '⚡ Forcing...' : '⚡ Force Refresh'}
      </button>
      
      <div className="bundle-inspector__last-updated">
        Last updated: {new Date(analysis.timestamp).toLocaleString()}
      </div>
    </div>
  );
  
  /**
   * Main render
   */
  return (
    <div className={`bundle-inspector ${className}`}>
      <div className="bundle-inspector__header">
        <h2>Bundle Inspector</h2>
        {renderRefreshControls()}
      </div>
      
      {renderTabNavigation()}
      
      <div className="bundle-inspector__content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'optimization' && renderOptimizationTab()}
        {activeTab === 'chunks' && (
          <div className="bundle-inspector__placeholder">
            <p>Chunks view implementation pending...</p>
            <small>Will show detailed chunk analysis and filtering</small>
          </div>
        )}
        {activeTab === 'modules' && (
          <div className="bundle-inspector__placeholder">
            <p>Modules view implementation pending...</p>
            <small>Will show detailed module analysis and dependencies</small>
          </div>
        )}
        {activeTab === 'dependencies' && (
          <div className="bundle-inspector__placeholder">
            <p>Dependencies view implementation pending...</p>
            <small>Will show interactive dependency graph</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default BundleInspector;
