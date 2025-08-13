/**
 * Route Tree Component
 * 
 * Hierarchical tree view of all application routes with expandable navigation.
 */

import React, { useState } from 'react';
import type { PluginComponentContext } from '@repo/nextjs-devtool/types';
import { useRouteTree } from '../hooks';
import type { RouteTreeNode } from '../shared/contract';

interface RouteTreeProps {
  context: PluginComponentContext;
}

interface TreeNodeProps {
  node: RouteTreeNode;
  level: number;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (route: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, expanded, onToggle, onNavigate }) => {
  const hasChildren = node.children && node.children.length > 0;
  const indentStyle = { paddingLeft: `${level * 20}px` };

  const getNodeIcon = () => {
    if (hasChildren) {
      return expanded ? '📂' : '📁';
    }
    switch (node.type) {
      case 'page':
        return '📄';
      case 'route':
        return '⚡';
      case 'layout':
        return '🏗️';
      case 'loading':
        return '⏳';
      case 'error':
        return '❌';
      case 'not-found':
        return '❓';
      default:
        return '📄';
    }
  };

  const getNodeColor = () => {
    switch (node.type) {
      case 'page':
        return 'text-blue-700';
      case 'route':
        return 'text-green-700';
      case 'layout':
        return 'text-purple-700';
      case 'loading':
        return 'text-yellow-700';
      case 'error':
        return 'text-red-700';
      case 'segment':
        return 'text-gray-600';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div>
      <div
        style={indentStyle}
        className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-50 cursor-pointer ${getNodeColor()}`}
        onClick={hasChildren ? onToggle : () => onNavigate('route-detail')}
      >
        {hasChildren && (
          <span className="text-gray-400 text-xs">
            {expanded ? '▼' : '▶'}
          </span>
        )}
        <span className="text-lg">{getNodeIcon()}</span>
        <div className="flex-1">
          <div className="font-mono text-sm">{node.path}</div>
          {node.name !== node.path && (
            <div className="text-xs text-gray-500">{node.name}</div>
          )}
        </div>
        <div className="text-xs text-gray-400">
          {node.type}
        </div>
      </div>
      
      {hasChildren && expanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <TreeNodeContainer
              key={`${child.id}-${index}`}
              node={child}
              level={level + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface TreeNodeContainerProps {
  node: RouteTreeNode;
  level: number;
  onNavigate: (route: string) => void;
}

const TreeNodeContainer: React.FC<TreeNodeContainerProps> = ({ node, level, onNavigate }) => {
  const [expanded, setExpanded] = useState(level < 2); // Auto-expand first 2 levels

  return (
    <TreeNode
      node={node}
      level={level}
      expanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      onNavigate={onNavigate}
    />
  );
};

export const RouteTree: React.FC<RouteTreeProps> = ({ context }) => {
  const { tree, loading, error, refetch } = useRouteTree(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filterTree = (nodes: RouteTreeNode[], search: string, type: string): RouteTreeNode[] => {
    return nodes.reduce((filtered: RouteTreeNode[], node) => {
      let includeNode = true;
      
      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        includeNode = node.path.toLowerCase().includes(searchLower) ||
                     node.name.toLowerCase().includes(searchLower);
      }
      
      // Apply type filter
      if (type !== 'all' && includeNode) {
        includeNode = node.type === type;
      }
      
      // Filter children recursively
      const filteredChildren = node.children ? filterTree(node.children, search, type) : undefined;
      
      // Include node if it matches or has matching children
      if (includeNode || (filteredChildren && filteredChildren.length > 0)) {
        filtered.push({
          ...node,
          children: filteredChildren,
        });
      }
      
      return filtered;
    }, []);
  };

  const filteredTree = tree ? filterTree(tree, searchTerm, typeFilter) : [];

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded" style={{ marginLeft: `${(i % 3) * 20}px` }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-red-600">
          <div className="text-4xl mb-2">❌</div>
          <p className="font-medium">Failed to load route tree</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Route Tree</h2>
        <div className="flex gap-2">
          <button
            onClick={() => context.onNavigate('explorer')}
            className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
          >
            List View
          </button>
          <button
            onClick={refetch}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="Search routes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <div className="flex flex-wrap gap-2">
          {['all', 'page', 'route', 'layout', 'loading', 'error'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                typeFilter === type
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tree Display */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Route Hierarchy</h3>
            <div className="text-sm text-gray-600">
              {filteredTree.length} routes shown
            </div>
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {filteredTree.length > 0 ? (
            <div className="p-2">
              {filteredTree.map((node, index) => (
                <TreeNodeContainer
                  key={`${node.id}-${index}`}
                  node={node}
                  level={0}
                  onNavigate={context.onNavigate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🌳</div>
              <p>No routes match your criteria</p>
              {(searchTerm || typeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setTypeFilter('all');
                  }}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span>📄</span>
            <span>Page</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⚡</span>
            <span>API Route</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🏗️</span>
            <span>Layout</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⏳</span>
            <span>Loading</span>
          </div>
          <div className="flex items-center gap-2">
            <span>❌</span>
            <span>Error</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📁</span>
            <span>Folder</span>
          </div>
        </div>
      </div>
    </div>
  );
};
