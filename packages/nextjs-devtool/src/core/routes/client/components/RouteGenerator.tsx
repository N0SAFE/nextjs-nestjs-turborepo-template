/**
 * Route Generator Component
 * 
 * Code generation and scaffolding tools for creating new routes.
 */

import React, { useState } from 'react';
import type { PluginComponentContext } from '@repo/nextjs-devtool/types';

interface RouteGeneratorProps {
  context: PluginComponentContext;
}

export const RouteGenerator: React.FC<RouteGeneratorProps> = ({ context }) => {
  const [routeType, setRouteType] = useState<'page' | 'api' | 'layout' | 'middleware'>('page');
  const [routePath, setRoutePath] = useState('');
  const [routeName, setRouteName] = useState('');
  const [options, setOptions] = useState({
    typescript: true,
    metadata: true,
    loading: false,
    error: false,
    authentication: false,
    caching: false,
  });
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<{
    success: boolean;
    files: Array<{ path: string; content: string }>;
    message: string;
  } | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      // Mock generation process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const files = generateRouteFiles(routeType, routePath, routeName, options);
      
      setGenerated({
        success: true,
        files,
        message: `Successfully generated ${files.length} files for ${routeName}`,
      });
    } catch (error) {
      setGenerated({
        success: false,
        files: [],
        message: 'Failed to generate route files',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    setRoutePath('');
    setRouteName('');
    setGenerated(null);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Route Generator</h1>
          <p className="text-gray-600">Scaffold new routes with best practices</p>
        </div>
        
        <button
          onClick={() => context.onNavigate('explorer')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          ← Back
        </button>
      </div>

      {!generated && (
        <>
          {/* Route Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Route Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Route Type
                </label>
                <select
                  value={routeType}
                  onChange={(e) => setRouteType(e.target.value as typeof routeType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="page">Page Route</option>
                  <option value="api">API Route</option>
                  <option value="layout">Layout</option>
                  <option value="middleware">Middleware</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Route Path
                </label>
                <input
                  type="text"
                  value={routePath}
                  onChange={(e) => setRoutePath(e.target.value)}
                  placeholder="/example/path"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use [param] for dynamic segments
                </p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Route Name
                </label>
                <input
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="MyNewRoute"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Generation Options */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Generation Options</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OptionCheckbox
                label="TypeScript"
                description="Generate TypeScript files with full type safety"
                checked={options.typescript}
                onChange={(checked) => setOptions(prev => ({ ...prev, typescript: checked }))}
              />
              
              <OptionCheckbox
                label="Metadata"
                description="Include SEO metadata and page.info.ts"
                checked={options.metadata}
                onChange={(checked) => setOptions(prev => ({ ...prev, metadata: checked }))}
              />
              
              <OptionCheckbox
                label="Loading State"
                description="Generate loading.tsx for better UX"
                checked={options.loading}
                onChange={(checked) => setOptions(prev => ({ ...prev, loading: checked }))}
              />
              
              <OptionCheckbox
                label="Error Boundary"
                description="Generate error.tsx for error handling"
                checked={options.error}
                onChange={(checked) => setOptions(prev => ({ ...prev, error: checked }))}
              />
              
              <OptionCheckbox
                label="Authentication"
                description="Add authentication middleware"
                checked={options.authentication}
                onChange={(checked) => setOptions(prev => ({ ...prev, authentication: checked }))}
              />
              
              <OptionCheckbox
                label="Caching"
                description="Include caching headers and strategies"
                checked={options.caching}
                onChange={(checked) => setOptions(prev => ({ ...prev, caching: checked }))}
              />
            </div>
          </div>

          {/* Preview */}
          {routePath && routeName && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Preview</h2>
              
              <div className="space-y-3">
                <div className="text-sm">
                  <strong>Files to be generated:</strong>
                  <ul className="mt-2 space-y-1 text-gray-600">
                    {getPreviewFiles(routeType, routePath, options).map((file, index) => (
                      <li key={index} className="font-mono text-sm">📄 {file}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="pt-4 border-t">
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !routePath || !routeName}
                    className={`px-6 py-3 rounded-lg font-medium ${
                      generating || !routePath || !routeName
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {generating ? 'Generating...' : 'Generate Route'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Generation Results */}
      {generated && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Generation Results</h2>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Generate Another
            </button>
          </div>
          
          <div className={`p-4 rounded-lg mb-4 ${
            generated.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`text-2xl ${generated.success ? 'text-green-600' : 'text-red-600'}`}>
                {generated.success ? '✅' : '❌'}
              </div>
              <p className={`font-medium ${generated.success ? 'text-green-800' : 'text-red-800'}`}>
                {generated.message}
              </p>
            </div>
          </div>
          
          {generated.success && generated.files.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Generated Files:</h3>
              {generated.files.map((file, index) => (
                <div key={index} className="border border-gray-200 rounded-lg">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h4 className="font-mono text-sm font-medium">{file.path}</h4>
                  </div>
                  <div className="p-4">
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                      <code>{file.content}</code>
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface OptionCheckboxProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const OptionCheckbox: React.FC<OptionCheckboxProps> = ({ label, description, checked, onChange }) => (
  <div className="flex items-start space-x-3">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
    />
    <div className="flex-1">
      <label className="text-sm font-medium text-gray-900">{label}</label>
      <p className="text-xs text-gray-600">{description}</p>
    </div>
  </div>
);

function getPreviewFiles(
  routeType: string, 
  routePath: string, 
  options: { typescript: boolean; metadata: boolean; loading: boolean; error: boolean; authentication: boolean; caching: boolean }
): string[] {
  const files: string[] = [];
  const ext = options.typescript ? 'tsx' : 'jsx';
  const basePath = routePath.replace(/^\//, '').replace(/\//g, '/');
  
  switch (routeType) {
    case 'page':
      files.push(`app/${basePath}/page.${ext}`);
      if (options.metadata) {
        files.push(`app/${basePath}/page.info.ts`);
      }
      if (options.loading) {
        files.push(`app/${basePath}/loading.${ext}`);
      }
      if (options.error) {
        files.push(`app/${basePath}/error.${ext}`);
      }
      break;
    case 'api':
      files.push(`app/api/${basePath}/route.ts`);
      if (options.metadata) {
        files.push(`app/api/${basePath}/route.info.ts`);
      }
      break;
    case 'layout':
      files.push(`app/${basePath}/layout.${ext}`);
      break;
    case 'middleware':
      files.push(`middleware/${basePath}.ts`);
      break;
  }
  
  return files;
}

function generateRouteFiles(
  routeType: string,
  routePath: string,
  routeName: string,
  options: { typescript: boolean; metadata: boolean; loading: boolean; error: boolean; authentication: boolean; caching: boolean }
): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = [];
  const ext = options.typescript ? 'tsx' : 'jsx';
  const basePath = routePath.replace(/^\//, '').replace(/\//g, '/');
  
  switch (routeType) {
    case 'page':
      files.push({
        path: `app/${basePath}/page.${ext}`,
        content: `import React from 'react';

export default function ${routeName}Page() {
  return (
    <div>
      <h1>${routeName}</h1>
      <p>Welcome to the ${routeName} page.</p>
    </div>
  );
}`,
      });
      
      if (options.metadata) {
        files.push({
          path: `app/${basePath}/page.info.ts`,
          content: `export const page = {
  params: {},
  searchParams: {},
  title: "${routeName}",
  description: "${routeName} page description",
};`,
        });
      }
      
      if (options.loading) {
        files.push({
          path: `app/${basePath}/loading.${ext}`,
          content: `export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded mb-4"></div>
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
  );
}`,
        });
      }
      
      if (options.error) {
        files.push({
          path: `app/${basePath}/error.${ext}`,
          content: `'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="text-center py-8">
      <h2 className="text-xl font-semibold text-red-600 mb-4">Something went wrong!</h2>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  );
}`,
        });
      }
      break;
      
    case 'api':
      files.push({
        path: `app/api/${basePath}/route.ts`,
        content: `import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Your API logic here
    return NextResponse.json({ message: 'Hello from ${routeName}' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Your API logic here
    return NextResponse.json({ message: 'Created', data: body });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}`,
      });
      break;
  }
  
  return files;
}
