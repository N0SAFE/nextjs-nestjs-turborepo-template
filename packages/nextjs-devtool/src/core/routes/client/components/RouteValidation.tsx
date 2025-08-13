/**
 * Route Validation Component
 * 
 * Validates route definitions, parameters, and configurations.
 */

import React, { useState } from 'react';
import type { PluginComponentContext } from '@repo/nextjs-devtool/types';
import { useRouteValidation } from '../hooks';

interface RouteValidationProps {
  context: PluginComponentContext;
  routeId?: string;
}

export const RouteValidation: React.FC<RouteValidationProps> = ({ context, routeId = 'all' }) => {
  const [validationType, setValidationType] = useState<'syntax' | 'structure' | 'performance' | 'accessibility'>('syntax');
  const { validation, loading, error } = useRouteValidation(routeId);

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

  if (error || !validation) {
    return (
      <div className="p-4">
        <div className="text-center py-8 text-red-600">
          <div className="text-4xl mb-2">✅</div>
          <p className="font-medium">Validation unavailable</p>
          <p className="text-sm text-gray-600 mt-1">{error || 'No validation data found'}</p>
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

  const validationArray = Array.isArray(validation) ? validation : [validation];
  const overallStatus = calculateOverallStatus(validationArray);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Route Validation</h1>
          <p className="text-gray-600">
            {routeId === 'all' ? 'All routes' : `Route: ${routeId}`}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={validationType}
            onChange={(e) => setValidationType(e.target.value as typeof validationType)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="syntax">Syntax</option>
            <option value="structure">Structure</option>
            <option value="performance">Performance</option>
            <option value="accessibility">Accessibility</option>
          </select>
          
          <button
            onClick={() => context.onNavigate('explorer')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Overall Status</h2>
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadgeColor(overallStatus.status)}`}>
            {overallStatus.status.toUpperCase()}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatusCard
            title="Valid Routes"
            count={overallStatus.validCount}
            total={overallStatus.totalCount}
            color="green"
            icon="✅"
          />
          
          <StatusCard
            title="With Warnings"
            count={overallStatus.warningCount}
            total={overallStatus.totalCount}
            color="yellow"
            icon="⚠️"
          />
          
          <StatusCard
            title="With Errors"
            count={overallStatus.errorCount}
            total={overallStatus.totalCount}
            color="red"
            icon="❌"
          />
          
          <StatusCard
            title="Not Tested"
            count={overallStatus.skippedCount}
            total={overallStatus.totalCount}
            color="gray"
            icon="⏭️"
          />
        </div>
      </div>

      {/* Validation Results */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Validation Results</h2>
        
        <div className="space-y-4">
          {validationArray.map((result) => (
            <ValidationResult
              key={result.routeId}
              result={result}
              validationType={validationType}
              onViewDetails={(routeId) => context.onNavigate('detail')}
            />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">🚀 Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionButton
            title="Fix All Issues"
            description="Automatically fix common validation issues"
            icon="🔧"
            onClick={() => console.log('Fix all issues')}
            disabled={overallStatus.errorCount === 0 && overallStatus.warningCount === 0}
          />
          
          <ActionButton
            title="Generate Report"
            description="Export validation report as PDF"
            icon="📄"
            onClick={() => console.log('Generate report')}
          />
          
          <ActionButton
            title="Run Full Scan"
            description="Perform comprehensive validation"
            icon="🔍"
            onClick={() => console.log('Run full scan')}
          />
          
          <ActionButton
            title="Setup CI Check"
            description="Add validation to CI pipeline"
            icon="⚙️"
            onClick={() => console.log('Setup CI check')}
          />
        </div>
      </div>

      {/* Validation Rules */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">📋 Validation Rules</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Syntax Rules</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>Valid file naming conventions</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>Proper parameter syntax</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>No duplicate routes</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>Valid metadata format</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Structure Rules</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>Proper nesting hierarchy</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>Layout inheritance</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>Route group organization</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>Middleware placement</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatusCardProps {
  title: string;
  count: number;
  total: number;
  color: 'green' | 'yellow' | 'red' | 'gray';
  icon: string;
}

const StatusCard: React.FC<StatusCardProps> = ({ title, count, total, color, icon }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    gray: 'bg-gray-50 border-gray-200 text-gray-900',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-2xl">{icon}</div>
        <div className="text-2xl font-bold">{count}</div>
      </div>
      <div className="text-sm font-medium mb-1">{title}</div>
      <div className="text-xs opacity-75">{percentage.toFixed(1)}% of {total}</div>
    </div>
  );
};

interface ValidationResultProps {
  result: {
    routeId: string;
    status: 'valid' | 'warning' | 'error';
    issues: Array<{
      type: string;
      severity: 'error' | 'warning' | 'info';
      message: string;
      line?: number;
      column?: number;
    }>;
    metadata?: {
      totalChecks: number;
      passedChecks: number;
    };
  };
  validationType: string;
  onViewDetails: (routeId: string) => void;
}

const ValidationResult: React.FC<ValidationResultProps> = ({ result, validationType, onViewDetails }) => {
  const filteredIssues = result.issues.filter(issue => 
    validationType === 'syntax' ? issue.type.includes('syntax') :
    validationType === 'structure' ? issue.type.includes('structure') :
    validationType === 'performance' ? issue.type.includes('performance') :
    validationType === 'accessibility' ? issue.type.includes('accessibility') :
    true
  );

  return (
    <div className={`border rounded-lg p-4 ${getResultBorderColor(result.status)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`text-2xl ${getResultIconColor(result.status)}`}>
            {getResultIcon(result.status)}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{result.routeId}</h3>
            {result.metadata && (
              <p className="text-sm text-gray-600">
                {result.metadata.passedChecks}/{result.metadata.totalChecks} checks passed
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(result.status)}`}>
            {result.status.toUpperCase()}
          </div>
          <button
            onClick={() => onViewDetails(result.routeId)}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Details
          </button>
        </div>
      </div>
      
      {filteredIssues.length > 0 && (
        <div className="space-y-2">
          {filteredIssues.slice(0, 3).map((issue, index) => (
            <div key={index} className="flex items-start space-x-2 text-sm">
              <div className={`mt-0.5 ${
                issue.severity === 'error' ? 'text-red-500' :
                issue.severity === 'warning' ? 'text-yellow-500' :
                'text-blue-500'
              }`}>
                {issue.severity === 'error' ? '❌' :
                 issue.severity === 'warning' ? '⚠️' : 'ℹ️'}
              </div>
              <div className="flex-1">
                <span className="text-gray-900">{issue.message}</span>
                {issue.line && (
                  <span className="text-gray-500 ml-2">
                    (line {issue.line}{issue.column ? `, col ${issue.column}` : ''})
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {filteredIssues.length > 3 && (
            <p className="text-sm text-gray-500 mt-2">
              +{filteredIssues.length - 3} more issues
            </p>
          )}
        </div>
      )}
    </div>
  );
};

interface ActionButtonProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ title, description, icon, onClick, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-4 text-left rounded-lg border transition-colors ${
      disabled
        ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
        : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
    }`}
  >
    <div className="text-2xl mb-2">{icon}</div>
    <h3 className="font-medium mb-1">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </button>
);

function calculateOverallStatus(validations: Array<{ status: string }>) {
  const totalCount = validations.length;
  const validCount = validations.filter(v => v.status === 'valid').length;
  const warningCount = validations.filter(v => v.status === 'warning').length;
  const errorCount = validations.filter(v => v.status === 'error').length;
  const skippedCount = totalCount - validCount - warningCount - errorCount;

  let status: 'valid' | 'warning' | 'error';
  if (errorCount > 0) {
    status = 'error';
  } else if (warningCount > 0) {
    status = 'warning';
  } else {
    status = 'valid';
  }

  return {
    status,
    totalCount,
    validCount,
    warningCount,
    errorCount,
    skippedCount,
  };
}

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'valid':
      return 'bg-green-100 text-green-800';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getResultBorderColor(status: string): string {
  switch (status) {
    case 'valid':
      return 'border-green-200 bg-green-50';
    case 'warning':
      return 'border-yellow-200 bg-yellow-50';
    case 'error':
      return 'border-red-200 bg-red-50';
    default:
      return 'border-gray-200 bg-gray-50';
  }
}

function getResultIcon(status: string): string {
  switch (status) {
    case 'valid':
      return '✅';
    case 'warning':
      return '⚠️';
    case 'error':
      return '❌';
    default:
      return '❓';
  }
}

function getResultIconColor(status: string): string {
  switch (status) {
    case 'valid':
      return 'text-green-600';
    case 'warning':
      return 'text-yellow-600';
    case 'error':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}
