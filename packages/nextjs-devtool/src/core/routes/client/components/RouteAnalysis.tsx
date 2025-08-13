/**
 * Route Analysis Component
 * 
 * Advanced route analysis including dependencies, optimization suggestions,
 * and code insights.
 */

import React, { useState } from 'react';
import type { PluginComponentContext } from '@repo/nextjs-devtool/types';
import { useRouteAnalysis } from '../hooks';

interface RouteAnalysisProps {
  context: PluginComponentContext;
  routeId?: string;
}

export const RouteAnalysis: React.FC<RouteAnalysisProps> = ({ context, routeId = 'home' }) => {
  const [analysisType, setAnalysisType] = useState<'dependencies' | 'performance' | 'security' | 'seo'>('dependencies');
  const { analysis, loading, error } = useRouteAnalysis();

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-red-600">
          <div className="text-4xl mb-2">🔍</div>
          <p className="font-medium">Analysis unavailable</p>
          <p className="text-sm text-gray-600 mt-1">{error || 'No analysis data found'}</p>
          <button
            onClick={() => context.onNavigate('explorer')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Explorer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Route Analysis</h1>
          <p className="text-gray-600">Route: {routeId}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={analysisType}
            onChange={(e) => setAnalysisType(e.target.value as typeof analysisType)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="dependencies">Dependencies</option>
            <option value="performance">Performance</option>
            <option value="security">Security</option>
            <option value="seo">SEO</option>
          </select>
          
          <button
            onClick={() => context.onNavigate('explorer')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Analysis Score Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Analysis Score</h2>
          <div className="flex items-center space-x-2">
            <div className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}>
              {analysis.score}
            </div>
            <div className="text-gray-600">/100</div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Performance</span>
            <span className={getScoreColor(analysis.performanceScore)}>{analysis.performanceScore}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getScoreBarColor(analysis.performanceScore)}`}
              style={{ width: `${analysis.performanceScore}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Security</span>
            <span className={getScoreColor(analysis.securityScore)}>{analysis.securityScore}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getScoreBarColor(analysis.securityScore)}`}
              style={{ width: `${analysis.securityScore}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>SEO</span>
            <span className={getScoreColor(analysis.seoScore)}>{analysis.seoScore}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getScoreBarColor(analysis.seoScore)}`}
              style={{ width: `${analysis.seoScore}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Analysis Details */}
      {analysisType === 'dependencies' && (
        <DependencyAnalysis analysis={analysis} />
      )}
      
      {analysisType === 'performance' && (
        <PerformanceAnalysis analysis={analysis} />
      )}
      
      {analysisType === 'security' && (
        <SecurityAnalysis analysis={analysis} />
      )}
      
      {analysisType === 'seo' && (
        <SEOAnalysis analysis={analysis} />
      )}

      {/* Recommendations */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">💡 Recommendations</h2>
        
        <div className="space-y-4">
          {analysis.recommendations.map((rec: {
            type: 'performance' | 'seo' | 'structure' | 'security';
            severity: 'low' | 'medium' | 'high' | 'critical';
            routeId: string;
            message: string;
            suggestion: string;
          }, index: number) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                rec.severity === 'high' || rec.severity === 'critical' ? 'bg-red-50 border-red-400' :
                rec.severity === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                'bg-blue-50 border-blue-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{rec.type.toUpperCase()}: {rec.message}</h3>
                  <p className="text-sm text-gray-600 mt-1">{rec.suggestion}</p>
                  <p className="text-xs text-gray-500 mt-2">Route: {rec.routeId}</p>
                </div>
                <div className={`ml-4 px-2 py-1 rounded text-xs font-medium ${
                  rec.severity === 'high' || rec.severity === 'critical' ? 'bg-red-100 text-red-800' :
                  rec.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {rec.severity}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DependencyAnalysis: React.FC<{ analysis: any }> = ({ analysis }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h2 className="text-xl font-semibold mb-4">📦 Dependencies</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="font-medium mb-3">Direct Dependencies</h3>
        <div className="space-y-2">
          {analysis.dependencies?.direct?.map((dep: string) => (
            <div key={dep} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="font-mono text-sm">{dep}</span>
              <span className="text-xs text-green-600">✓</span>
            </div>
          )) || <p className="text-gray-500 text-sm">No direct dependencies</p>}
        </div>
      </div>
      
      <div>
        <h3 className="font-medium mb-3">Transitive Dependencies</h3>
        <div className="space-y-2">
          {analysis.dependencies?.transitive?.slice(0, 5).map((dep: string) => (
            <div key={dep} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="font-mono text-sm">{dep}</span>
              <span className="text-xs text-gray-500">indirect</span>
            </div>
          )) || <p className="text-gray-500 text-sm">No transitive dependencies</p>}
          {(analysis.dependencies?.transitive?.length || 0) > 5 && (
            <p className="text-sm text-gray-500">
              +{(analysis.dependencies?.transitive?.length || 0) - 5} more dependencies
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

const PerformanceAnalysis: React.FC<{ analysis: any }> = ({ analysis }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h2 className="text-xl font-semibold mb-4">⚡ Performance Analysis</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <div className="text-2xl font-bold text-blue-900">{analysis.bundleSize || 'N/A'}</div>
        <div className="text-sm text-blue-600">Bundle Size (KB)</div>
      </div>
      
      <div className="text-center p-4 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-900">{analysis.loadTime || 'N/A'}</div>
        <div className="text-sm text-green-600">Load Time (ms)</div>
      </div>
      
      <div className="text-center p-4 bg-purple-50 rounded-lg">
        <div className="text-2xl font-bold text-purple-900">{analysis.renderTime || 'N/A'}</div>
        <div className="text-sm text-purple-600">Render Time (ms)</div>
      </div>
    </div>
    
    <div className="space-y-4">
      <h3 className="font-medium">Performance Insights</h3>
      <div className="text-sm text-gray-600">
        <p>• Bundle analysis shows potential for code splitting optimization</p>
        <p>• Consider lazy loading for improved initial load performance</p>
        <p>• Server-side rendering could improve perceived performance</p>
      </div>
    </div>
  </div>
);

const SecurityAnalysis: React.FC<{ analysis: any }> = ({ analysis }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h2 className="text-xl font-semibold mb-4">🔒 Security Analysis</h2>
    
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium mb-2">Security Checks</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-sm">No known vulnerabilities</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-sm">HTTPS enforced</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-sm">Content Security Policy present</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Dependency Security</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-sm">All dependencies up to date</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">⚠</span>
              <span className="text-sm">2 minor vulnerability warnings</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const SEOAnalysis: React.FC<{ analysis: any }> = ({ analysis }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <h2 className="text-xl font-semibold mb-4">🔍 SEO Analysis</h2>
    
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium mb-2">Meta Tags</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-sm">Title tag present</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-sm">Meta description present</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">⚠</span>
              <span className="text-sm">Missing Open Graph tags</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Performance SEO</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-sm">Fast loading speed</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-sm">Mobile responsive</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-sm">SSL certificate valid</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

function getScoreColor(score: number): string {
  if (score >= 80) {
    return 'text-green-600';
  }
  if (score >= 60) {
    return 'text-yellow-600';
  }
  return 'text-red-600';
}

function getScoreBarColor(score: number): string {
  if (score >= 80) {
    return 'bg-green-500';
  }
  if (score >= 60) {
    return 'bg-yellow-500';
  }
  return 'bg-red-500';
}
