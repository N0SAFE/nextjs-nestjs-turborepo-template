import { useState } from 'react';
import type { ProjectConfig } from './types';
import { StepIndicator } from './components/StepIndicator';
import { ProjectInfoStep } from './components/steps/ProjectInfoStep';
import { FeatureSelectionStep } from './components/steps/FeatureSelectionStep';
import { CommandGenerationStep } from './components/steps/CommandGenerationStep';
import { resolveDependencies } from './utils/dependency-resolver';
import { plugins } from './data/plugins';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const steps = [
  { id: 1, title: 'Project Info' },
  { id: 2, title: 'Select Features' },
  { id: 3, title: 'Generate Command' },
];

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<ProjectConfig>({
    projectName: 'my-saas',
    description: '',
    author: '',
    license: 'MIT',
    packageManager: 'bun',
    template: 'custom',
    features: ['base', 'typescript', 'turborepo'],
    pluginConfigs: {},
    apiPort: 3001,
    webPort: 3000,
  });

  const updateConfig = (updates: Partial<ProjectConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };
      
      // Auto-resolve dependencies when features change
      if (updates.features) {
        const resolved = resolveDependencies(updates.features, plugins);
        newConfig.features = resolved;
      }
      
      return newConfig;
    });
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return config.projectName.trim().length > 0;
    }
    return true;
  };

  const nextStep = () => {
    if (canProceed() && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              🎯 Stratum Builder
            </h1>
            <p className="text-lg text-gray-400">
              Configure your project visually and generate the CLI command
            </p>
          </div>

          {/* Step Indicator */}
          <StepIndicator currentStep={currentStep} steps={steps} />

          {/* Main Content */}
          <div className="bg-gray-800 rounded-xl shadow-lg shadow-black/20 border border-gray-700 p-8 mb-6">
            {currentStep === 1 && (
              <ProjectInfoStep config={config} onChange={updateConfig} />
            )}
            {currentStep === 2 && (
              <FeatureSelectionStep config={config} onChange={updateConfig} />
            )}
            {currentStep === 3 && <CommandGenerationStep config={config} />}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
              Back
            </button>

            {currentStep < steps.length && (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={20} />
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-gray-500 text-sm">
            <p>
              Built with ❤️ for the Stratum Builder •{' '}
              <a
                href="https://github.com/N0SAFE/nextjs-nestjs-turborepo-template"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                View Documentation
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
