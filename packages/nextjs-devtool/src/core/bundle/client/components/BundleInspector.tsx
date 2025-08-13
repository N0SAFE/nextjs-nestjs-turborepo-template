/**
 * Bundle Inspector Component
 * 
 * Interactive bundle analysis and chunk exploration.
 */

import React, { useState, useEffect } from 'react';
import type { PluginComponentContext } from '@repo/nextjs-devtool/types';

interface BundleInspectorProps {
  context: PluginComponentContext;
}

interface ChunkInfo {
  id: string;
  name: string;
  size: number;
  gzipSize: number;
  modules: ModuleInfo[];
  type: 'page' | 'shared' | 'runtime' | 'vendor';
  loadTime?: number;
}

interface ModuleInfo {
  id: string;
  name: string;
  size: number;
  path: string;
  imported: boolean;
  dependencies: string[];
}

interface BundleStats {
  totalSize: number;
  gzipSize: number;
  chunkCount: number;
  moduleCount: number;
  duplicates: number;
}

export const BundleInspector: React.FC<BundleInspectorProps> = ({ context }) => {
  const [chunks, setChunks] = useState<ChunkInfo[]>([]);
  const [stats, setStats] = useState<BundleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChunk, setSelectedChunk] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chunks' | 'modules' | 'duplicates'>('chunks');

  useEffect(() => {
    const loadBundleData = async () => {
      setLoading(true);
      
      // Mock bundle data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockChunks: ChunkInfo[] = [
        {
          id: 'main',
          name: 'Main Bundle',
          size: 245600,
          gzipSize: 89200,
          type: 'runtime',
          loadTime: 120,
          modules: [
            {
              id: 'react',
              name: 'react',
              size: 45600,
              path: 'node_modules/react/index.js',
              imported: true,
              dependencies: [],
            },
            {
              id: 'next',
              name: '@next/core',
              size: 89200,
              path: 'node_modules/next/dist/client/index.js',
              imported: true,
              dependencies: ['react'],
            },
          ],
        },
        {
          id: 'page-home',
          name: 'Home Page',
          size: 34200,
          gzipSize: 12400,
          type: 'page',
          loadTime: 45,
          modules: [
            {
              id: 'home-component',
              name: 'HomePage',
              size: 12400,
              path: 'src/app/page.tsx',
              imported: true,
              dependencies: ['react'],
            },
            {
              id: 'ui-button',
              name: 'Button',
              size: 8900,
              path: 'packages/ui/components/button.tsx',
              imported: true,
              dependencies: ['react'],
            },
          ],
        },
        {
          id: 'vendors',
          name: 'Vendor Libraries',
          size: 456800,
          gzipSize: 156900,
          type: 'vendor',
          modules: [
            {
              id: 'lodash',
              name: 'lodash',
              size: 156900,
              path: 'node_modules/lodash/index.js',
              imported: true,
              dependencies: [],
            },
          ],
        },
      ];
      
      const mockStats: BundleStats = {
        totalSize: mockChunks.reduce((sum, chunk) => sum + chunk.size, 0),
        gzipSize: mockChunks.reduce((sum, chunk) => sum + chunk.gzipSize, 0),
        chunkCount: mockChunks.length,
        moduleCount: mockChunks.reduce((sum, chunk) => sum + chunk.modules.length, 0),
        duplicates: 2,
      };
      
      setChunks(mockChunks);
      setStats(mockStats);
      setLoading(false);
    };

    loadBundleData();
  }, []);

  const formatSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) {
      return '0 B';
    }
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getChunkTypeColor = (type: ChunkInfo['type']): string => {
    switch (type) {
      case 'page':
        return 'bg-blue-100 text-blue-800';
      case 'shared':
        return 'bg-green-100 text-green-800';
      case 'runtime':
        return 'bg-purple-100 text-purple-800';
      case 'vendor':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChunkIcon = (type: ChunkInfo['type']): string => {
    switch (type) {
      case 'page':
        return '📄';
      case 'shared':
        return '🔗';
      case 'runtime':
        return '⚙️';
      case 'vendor':
        return '📦';
      default:
        return '📁';
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">⚠️</div>
          <p>Unable to load bundle data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Bundle Inspector</h2>
        <div className="flex gap-2">
          {['chunks', 'modules', 'duplicates'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as typeof viewMode)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{formatSize(stats.totalSize)}</div>
          <div className="text-sm text-gray-600">Total Size</div>
          <div className="text-xs text-gray-500 mt-1">
            {formatSize(stats.gzipSize)} gzipped
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.chunkCount}</div>
          <div className="text-sm text-gray-600">Chunks</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.moduleCount}</div>
          <div className="text-sm text-gray-600">Modules</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{stats.duplicates}</div>
          <div className="text-sm text-gray-600">Duplicates</div>
        </div>
      </div>

      {/* Chunks View */}
      {viewMode === 'chunks' && (
        <div className="space-y-3">
          {chunks.map(chunk => (
            <div
              key={chunk.id}
              className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
                selectedChunk === chunk.id
                  ? 'border-blue-500 shadow-md'
                  : 'border-gray-200 hover:shadow-md'
              }`}
              onClick={() => setSelectedChunk(selectedChunk === chunk.id ? null : chunk.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getChunkIcon(chunk.type)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{chunk.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{formatSize(chunk.size)}</span>
                      <span>•</span>
                      <span>{formatSize(chunk.gzipSize)} gzipped</span>
                      <span>•</span>
                      <span>{chunk.modules.length} modules</span>
                      {chunk.loadTime && (
                        <>
                          <span>•</span>
                          <span>{chunk.loadTime}ms load</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChunkTypeColor(chunk.type)}`}>
                    {chunk.type}
                  </span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min((chunk.size / stats.totalSize) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {selectedChunk === chunk.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Modules ({chunk.modules.length})</h4>
                  <div className="space-y-2">
                    {chunk.modules.map(module => (
                      <div key={module.id} className="flex items-center justify-between text-sm">
                        <div className="flex-1">
                          <div className="font-mono text-gray-700">{module.name}</div>
                          <div className="text-gray-500 text-xs">{module.path}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-700">{formatSize(module.size)}</div>
                          {module.dependencies.length > 0 && (
                            <div className="text-gray-500 text-xs">
                              deps: {module.dependencies.length}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modules View */}
      {viewMode === 'modules' && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">All Modules</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {chunks.flatMap(chunk => 
              chunk.modules.map(module => ({
                ...module,
                chunkName: chunk.name,
                chunkType: chunk.type,
              }))
            )
            .sort((a, b) => b.size - a.size)
            .map(module => (
              <div key={`${module.chunkName}-${module.id}`} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-mono text-gray-900">{module.name}</div>
                    <div className="text-sm text-gray-500">{module.path}</div>
                    <div className="text-xs text-gray-400">
                      in {module.chunkName} • {module.dependencies.length} dependencies
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatSize(module.size)}</div>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getChunkTypeColor(module.chunkType)}`}>
                      {module.chunkType}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duplicates View */}
      {viewMode === 'duplicates' && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-lg font-medium">Duplicate Analysis</p>
            <p className="text-sm mt-2">Found {stats.duplicates} potential duplicate modules</p>
            <div className="mt-4 text-left max-w-md mx-auto space-y-2">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="font-mono text-sm">lodash/debounce</div>
                <div className="text-xs text-gray-600">Found in 2 chunks • 12KB</div>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="font-mono text-sm">react/jsx-runtime</div>
                <div className="text-xs text-gray-600">Found in 3 chunks • 8KB</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
