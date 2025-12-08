import type { Plugin, ProjectConfig } from '../../types';
import { plugins as allPlugins, getDefaultPlugins } from '../../data/plugins';
import { clsx } from 'clsx';
import { Check, Code, ExternalLink, Beaker } from 'lucide-react';
import { useEffect } from 'react';

interface FeatureSelectionStepProps {
  config: ProjectConfig;
  onChange: (config: Partial<ProjectConfig>) => void;
}

export function FeatureSelectionStep({ config, onChange }: FeatureSelectionStepProps) {
  // Auto-select default plugins on first render
  useEffect(() => {
    const defaultPluginIds = getDefaultPlugins().map((p) => p.id);
    const missingDefaults = defaultPluginIds.filter((id) => !config.features.includes(id));
    if (missingDefaults.length > 0) {
      onChange({ features: [...new Set([...config.features, ...defaultPluginIds])] });
    }
  }, []);

  const toggleFeature = (pluginId: string) => {
    const features = config.features.includes(pluginId)
      ? config.features.filter((id) => id !== pluginId)
      : [...config.features, pluginId];
    onChange({ features });
  };

  const categories = [
    { id: 'feature', title: 'Feature Plugins', emoji: '🔌' },
    { id: 'infrastructure', title: 'Infrastructure', emoji: '🏗️' },
    { id: 'ui', title: 'UI & Design', emoji: '🎨' },
    { id: 'integration', title: 'Integrations', emoji: '🔗' },
  ] as const;

  const getCategoryPlugins = (category: string) => {
    return allPlugins.filter((p) => p.category === category);
  };

  const devOnlyCount = config.features.filter(
    (id) => allPlugins.find((p) => p.id === id)?.devOnly
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Select Features</h2>
        <p className="mt-2 text-gray-400">
          Choose the features you want to include in your project
        </p>
      </div>

      <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-300 mb-2">✓ Core Features (Included)</h3>
        <div className="flex gap-3 flex-wrap">
          {allPlugins
            .filter((p) => p.category === 'core')
            .map((plugin) => (
              <span
                key={plugin.id}
                className="px-3 py-1 bg-blue-800/50 text-blue-300 rounded-full text-sm font-medium"
              >
                {plugin.name}
              </span>
            ))}
        </div>
      </div>

      {categories.map((category) => (
        <div key={category.id}>
          <h3 className="text-lg font-semibold text-white mb-4">
            {category.emoji} {category.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getCategoryPlugins(category.id).map((plugin) => (
              <FeatureCard
                key={plugin.id}
                plugin={plugin}
                selected={config.features.includes(plugin.id)}
                onToggle={() => toggleFeature(plugin.id)}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 flex items-center justify-between">
        <p className="text-sm text-gray-300">
          <span className="font-semibold">Selected:</span> {config.features.length} features
          {devOnlyCount > 0 && (
            <span className="ml-2 text-amber-400">
              ({devOnlyCount} dev-only)
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onChange({ features: getDefaultPlugins().map((p) => p.id) })}
            className="text-xs px-3 py-1 bg-gray-600 text-gray-300 rounded hover:bg-gray-500 transition"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  plugin: Plugin;
  selected: boolean;
  onToggle: () => void;
}

function FeatureCard({ plugin, selected, onToggle }: FeatureCardProps) {
  return (
    <button
      onClick={onToggle}
      className={clsx(
        'text-left p-4 rounded-lg border-2 transition-all hover:shadow-md hover:shadow-black/20 relative',
        selected
          ? 'border-blue-500 bg-blue-900/30'
          : 'border-gray-600 hover:border-gray-500 bg-gray-700/30'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-white truncate">{plugin.name}</h4>
            {plugin.devOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-900/50 text-amber-400 rounded text-xs font-medium">
                <Beaker size={12} />
                Dev
              </span>
            )}
            {plugin.default && !selected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-900/50 text-green-400 rounded text-xs font-medium">
                Recommended
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{plugin.description}</p>
          
          {/* Tags */}
          {plugin.tags && plugin.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {plugin.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 bg-gray-600 text-gray-400 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
              {plugin.tags.length > 3 && (
                <span className="px-1.5 py-0.5 text-gray-500 text-xs">
                  +{plugin.tags.length - 3}
                </span>
              )}
            </div>
          )}
          
          {/* Dependencies */}
          {plugin.dependencies.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Requires: {plugin.dependencies.join(', ')}
            </p>
          )}
          
          {/* Documentation Link */}
          {plugin.docsUrl && (
            <a
              href={plugin.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2"
            >
              <ExternalLink size={12} />
              Docs
            </a>
          )}
        </div>
        <div
          className={clsx(
            'ml-2 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
            selected ? 'bg-blue-500' : 'bg-gray-600'
          )}
        >
          {selected && <Check size={16} className="text-white" />}
        </div>
      </div>
    </button>
  );
}
