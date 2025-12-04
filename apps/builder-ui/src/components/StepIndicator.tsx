import { Check } from 'lucide-react';
import { clsx } from 'clsx';

interface StepIndicatorProps {
  currentStep: number;
  steps: { id: number; title: string }[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors',
                  currentStep > step.id
                    ? 'bg-blue-600 text-white'
                    : currentStep === step.id
                    ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                    : 'bg-gray-200 text-gray-600'
                )}
              >
                {currentStep > step.id ? <Check size={20} /> : step.id}
              </div>
              <span
                className={clsx(
                  'mt-2 text-sm font-medium',
                  currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                )}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={clsx(
                  'h-1 flex-1 mx-4 transition-colors',
                  currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
