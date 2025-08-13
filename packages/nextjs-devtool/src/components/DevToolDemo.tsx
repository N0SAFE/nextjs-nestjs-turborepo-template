/**
 * DevTool Demo Component
 * 
 * Demonstrates the new DevTool UI with both reduced and expanded modes.
 * Shows how to integrate the DevTool system into a Next.js application.
 */

'use client'

import { useState } from 'react'
import { DevToolProvider, DevToolContainer } from '@repo/nextjs-devtool'

/**
 * Demo Application Component
 */
export const DevToolDemo = () => {
  const [demoContent, setDemoContent] = useState('Welcome to the DevTool Demo!')

  return (
    <DevToolProvider autoStart enableInProduction>
      <div className="min-h-screen bg-gray-50 p-8">
        {/* Demo Content */}
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              NextJS DevTool Demo
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Experience the new DevTool UI with reduced and expanded modes
            </p>
            
            {/* Demo Controls */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setDemoContent('Routes have been updated!')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Trigger Route Change
              </button>
              <button
                onClick={() => setDemoContent('Performance metrics refreshed!')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Refresh Performance
              </button>
              <button
                onClick={() => setDemoContent('Bundle analysis complete!')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Analyze Bundle
              </button>
            </div>
          </header>

          {/* Content Area */}
          <main className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">Demo Content</h2>
            <p className="text-gray-700 mb-6">{demoContent}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  Reduced Mode
                </h3>
                <p className="text-blue-700 text-sm">
                  Compact bar interface that can be positioned on any side of the screen
                  (top, bottom, left, right) with quick access to plugins.
                </p>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-green-900 mb-2">
                  Expanded Mode
                </h3>
                <p className="text-green-700 text-sm">
                  Full sidebar interface positioned at the bottom center with complete
                  plugin management and detailed views.
                </p>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-purple-900 mb-2">
                  Keyboard Shortcuts
                </h3>
                <ul className="text-purple-700 text-sm space-y-1">
                  <li><kbd>Ctrl+Shift+D</kbd> - Toggle DevTools</li>
                  <li><kbd>Ctrl+E</kbd> - Expand to sidebar</li>
                  <li><kbd>Escape</kbd> - Close DevTools</li>
                </ul>
              </div>
            </div>
          </main>
        </div>

        {/* DevTool Container - The new UI system */}
        <DevToolContainer
          defaultMode="none"
          defaultPosition={{
            side: 'bottom',
            size: 4,
            offset: { x: 0, y: 0 }
          }}
          enableKeyboardShortcuts={true}
        />
      </div>
    </DevToolProvider>
  )
}

/**
 * Instructions Component
 */
export const DevToolInstructions = () => {
  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
      <h3 className="font-medium text-gray-900 mb-2">How to Use DevTools</h3>
      <ol className="text-sm text-gray-600 space-y-1">
        <li>1. Click the floating 🛠️ button to open DevTools</li>
        <li>2. Use the reduced bar to quickly access plugins</li>
        <li>3. Click the expand button to switch to sidebar mode</li>
        <li>4. Change position using the dropdown menu</li>
        <li>5. Use keyboard shortcuts for quick access</li>
      </ol>
    </div>
  )
}

export default DevToolDemo
