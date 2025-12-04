import type { ProjectConfig } from '../../types';
import { generateCommand, copyToClipboard } from '../../utils/command-generator';
import { Copy, Check, Download } from 'lucide-react';
import { useState } from 'react';

interface CommandGenerationStepProps {
  config: ProjectConfig;
}

export function CommandGenerationStep({ config }: CommandGenerationStepProps) {
  const [copied, setCopied] = useState(false);
  const command = generateCommand(config);

  const handleCopy = async () => {
    await copyToClipboard(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadConfig = () => {
    const configJson = JSON.stringify(config, null, 2);
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stratum-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">🚀 Ready to Generate!</h2>
        <p className="mt-2 text-gray-600">
          Your configuration is complete. Here's the CLI command to create your project.
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-6 relative">
        <pre className="text-green-400 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all">
          {command}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check size={20} className="text-green-400" />
          ) : (
            <Copy size={20} className="text-gray-400" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {copied ? (
            <>
              <Check size={20} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={20} />
              Copy Command
            </>
          )}
        </button>

        <button
          onClick={handleDownloadConfig}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          <Download size={20} />
          Download Config (JSON)
        </button>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-semibold text-green-900 mb-3">📝 Next Steps:</h3>
        <ol className="space-y-2 text-green-800">
          <li className="flex items-start">
            <span className="font-bold mr-2">1.</span>
            <span>Copy the command above</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">2.</span>
            <span>Open your terminal</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">3.</span>
            <span>Paste and run the command</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">4.</span>
            <span>Wait for the project to be generated</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold mr-2">5.</span>
            <span>Start building your amazing project! 🎉</span>
          </li>
        </ol>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Tip:</h4>
        <p className="text-blue-800 text-sm">
          You can also download the configuration as a JSON file and use it later with{' '}
          <code className="bg-blue-100 px-2 py-1 rounded font-mono text-xs">
            stratum init --config stratum-config.json
          </code>
        </p>
      </div>
    </div>
  );
}
