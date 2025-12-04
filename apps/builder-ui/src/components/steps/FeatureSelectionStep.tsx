import type { Plugin, ProjectConfig } from '../../types';
import { plugins as allPlugins } from '../../data/plugins';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

interface FeatureSelectionStepProps {
  config: ProjectConfig;
  onChange: (config: Partial<ProjectConfig>) => void;
}

export function FeatureSelectionStep({ config, onChange }: FeatureSelectionStepProps) {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Select Features</h2>
        <p className="mt-2 text-gray-600">
          Choose the features you want to include in your project
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">✓ Core Features (Included)</h3>
        <div className="flex gap-3 flex-wrap">
          {allPlugins
            .filter((p) => p.category === 'core')
            .map((plugin) => (
              <span
                key={plugin.id}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
              >
                {plugin.name}
              </span>
            ))}
        </div>
      </div>

      {categories.map((category) => (
        <div key={category.id}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
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

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Selected:</span> {config.features.length} features
        </p>
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
        'text-left p-4 rounded-lg border-2 transition-all hover:shadow-md',
        selected
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{plugin.name}</h4>
          <p className="text-sm text-gray-600 mt-1">{plugin.description}</p>
          {plugin.dependencies.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Requires: {plugin.dependencies.join(', ')}
            </p>
          )}
        </div>
        <div
          className={clsx(
            'ml-2 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
            selected ? 'bg-blue-600' : 'bg-gray-200'
          )}
        >
          {selected && <Check size={16} className="text-white" />}
        </div>
      </div>
    </button>
  );
}
