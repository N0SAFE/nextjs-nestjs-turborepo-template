/**
 * DevToolReducedBar - Laravel Debugbar Style Component
 * 
 * Provides a horizontal bar interface at the bottom of the screen
 * with plugin tabs similar to Laravel Debugbar.
 */

'use client'

import { useCallback } from 'react'
import { 
  ChevronUp,
  Settings,
  X,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@repo/ui/components/shadcn/button'
import { Badge } from '@repo/ui/components/shadcn/badge'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@repo/ui/components/shadcn/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@repo/ui/components/shadcn/dropdown-menu'
import { usePluginRegistry } from '../runtime/pluginRegistry'
import { useDevTool } from './DevToolProvider'
import type { DevToolPosition } from '../types'

/**
 * Reduced Bar Props
 */
interface DevToolReducedBarProps {
  readonly position: DevToolPosition
  readonly onExpand: () => void
  readonly onClose: () => void
  readonly onPositionChange: (position: Partial<DevToolPosition>) => void
}

/**
 * DevTool Reduced Bar Component - Laravel Debugbar Style
 */
export const DevToolReducedBar = ({
  position,
  onExpand,
  onClose,
  onPositionChange,
}: DevToolReducedBarProps) => {
  const { plugins } = useDevTool()
  const pluginRegistry = usePluginRegistry()

  // Get active plugins
  const activePlugins = plugins.filter(plugin => 
    pluginRegistry.activePlugins.has(plugin.name)
  )

  // Handle plugin activation
  const handlePluginToggle = useCallback((pluginId: string) => {
    if (pluginRegistry.activePlugins.has(pluginId)) {
      pluginRegistry.deactivate(pluginId)
    } else {
      pluginRegistry.activate(pluginId)
    }
  }, [pluginRegistry])

  return (
    <TooltipProvider>
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg"
        style={{ height: `${position.size}rem` }}
      >
        <div className="flex items-center justify-between h-full px-4 max-w-full overflow-hidden">
          {/* Plugin Tabs - Laravel Debugbar Style */}
          <div className="flex items-center gap-1 flex-1 overflow-x-auto">
            {activePlugins.map(plugin => (
              <Tooltip key={plugin.name}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handlePluginToggle(plugin.name)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-muted/50 hover:bg-muted transition-colors duration-150 whitespace-nowrap min-w-fit"
                  >
                    {plugin.meta?.icon && (
                      <span className="text-sm">{plugin.meta.icon}</span>
                    )}
                    <span className="font-medium">
                      {plugin.meta?.displayName || plugin.name}
                    </span>
                    {/* Status indicator */}
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{plugin.meta?.displayName || plugin.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {plugin.meta?.description || 'DevTool Plugin'}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}

            {/* Add Plugin Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="px-2 py-1.5 h-auto text-xs">
                  <span className="mr-1">+</span>
                  Add Plugin
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  Available Plugins
                </div>
                {plugins
                  .filter(plugin => !pluginRegistry.activePlugins.has(plugin.name))
                  .map(plugin => (
                    <DropdownMenuItem
                      key={plugin.name}
                      onClick={() => handlePluginToggle(plugin.name)}
                      className="flex items-center gap-2"
                    >
                      {plugin.meta?.icon && (
                        <span className="text-sm">{plugin.meta.icon}</span>
                      )}
                      <span className="flex-1">{plugin.meta?.displayName || plugin.name}</span>
                      <Badge variant="secondary" className="text-xs">Add</Badge>
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 ml-4">
            {/* DevTool Logo/Brand */}
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-muted-foreground">DevTools</span>
            </div>

            {/* Expand Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={onExpand}
                >
                  <ChevronUp size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Expand DevTools</p>
              </TooltipContent>
            </Tooltip>

            {/* Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top">
                <DropdownMenuItem>
                  <Settings size={14} className="mr-2" />
                  Settings
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={onClose} className="text-red-600">
                  <X size={14} className="mr-2" />
                  Close DevTools
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
