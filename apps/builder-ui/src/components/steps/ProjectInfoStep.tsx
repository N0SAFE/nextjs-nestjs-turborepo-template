import type { ProjectConfig } from '../../types';

interface ProjectInfoStepProps {
  config: ProjectConfig;
  onChange: (config: Partial<ProjectConfig>) => void;
}

export function ProjectInfoStep({ config, onChange }: ProjectInfoStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Project Information</h2>
        <p className="mt-2 text-gray-600">
          Let's start with basic information about your project
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name *
          </label>
          <input
            type="text"
            value={config.projectName}
            onChange={(e) => onChange({ projectName: e.target.value })}
            placeholder="my-awesome-saas"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={config.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Production-ready SaaS platform"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Author
            </label>
            <input
              type="text"
              value={config.author}
              onChange={(e) => onChange({ author: e.target.value })}
              placeholder="John Doe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License
            </label>
            <select
              value={config.license}
              onChange={(e) => onChange({ license: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="MIT">MIT</option>
              <option value="Apache-2.0">Apache 2.0</option>
              <option value="GPL-3.0">GPL 3.0</option>
              <option value="BSD-3-Clause">BSD 3-Clause</option>
              <option value="ISC">ISC</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Package Manager
          </label>
          <div className="grid grid-cols-4 gap-4">
            {(['npm', 'yarn', 'pnpm', 'bun'] as const).map((pm) => (
              <button
                key={pm}
                onClick={() => onChange({ packageManager: pm })}
                className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${
                  config.packageManager === pm
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {pm}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
