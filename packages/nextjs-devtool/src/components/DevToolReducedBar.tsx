/**
 * DevToolReducedBar - Compact Bar Mode Component
 * 
 * Provides a compact bar interface that can be positioned on any side
 * of the screen (top, bottom, left, right) with quick access to plugins.
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  X,
  Move,
  MoreHorizontal,
  MoreVertical
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
 * Position option for the dropdown
 */
interface PositionOption {
  readonly side: DevToolPosition['side']
  readonly label: string
  readonly icon: React.ComponentType<{ size?: number }>
}

const positionOptions: readonly PositionOption[] = [
  { side: 'top', label: 'Top', icon: ChevronUp },
  { side: 'bottom', label: 'Bottom', icon: ChevronDown },
  { side: 'left', label: 'Left', icon: ChevronLeft },
  { side: 'right', label: 'Right', icon: ChevronRight },
] as const

/**
 * DevTool Reduced Bar Component
 */
export const DevToolReducedBar = ({
  position,
  onExpand,
  onClose,
  onPositionChange,
}: DevToolReducedBarProps) => {
  const { plugins } = useDevTool()
  const pluginRegistry = usePluginRegistry()
  
  const [isDragging, setIsDragging] = useState(false)

  // Get active plugins
  const activePlugins = plugins.filter(plugin => 
    pluginRegistry.activePlugins.has(plugin.name)
  )

  // Calculate bar styles based on position
  const barStyles = useMemo(() => {
    const isHorizontal = position.side === 'top' || position.side === 'bottom'
    const size = `${position.size}rem`
    
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 40,
      backgroundColor: 'rgb(255 255 255)',
      borderColor: 'rgb(229 231 235)',
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    }

    switch (position.side) {
      case 'top':
        return {
          ...baseStyles,
          top: `${position.offset.y}px`,
          left: `${position.offset.x}px`,
          right: `${position.offset.x}px`,
          height: size,
          borderBottomWidth: '1px',
          borderTopLeftRadius: '0px',
          borderTopRightRadius: '0px',
          borderBottomLeftRadius: '0.5rem',
          borderBottomRightRadius: '0.5rem',
        }
      case 'bottom':
        return {
          ...baseStyles,
          bottom: `${position.offset.y}px`,
          left: `${position.offset.x}px`,
          right: `${position.offset.x}px`,
          height: size,
          borderTopWidth: '1px',
          borderTopLeftRadius: '0.5rem',
          borderTopRightRadius: '0.5rem',
          borderBottomLeftRadius: '0px',
          borderBottomRightRadius: '0px',
        }
      case 'left':
        return {
          ...baseStyles,
          top: `${position.offset.y}px`,
          bottom: `${position.offset.y}px`,
          left: `${position.offset.x}px`,
          width: size,
          borderRightWidth: '1px',
          borderTopLeftRadius: '0px',
          borderBottomLeftRadius: '0px',
          borderTopRightRadius: '0.5rem',
          borderBottomRightRadius: '0.5rem',
        }
      case 'right':
        return {
          ...baseStyles,
          top: `${position.offset.y}px`,
          bottom: `${position.offset.y}px`,
          right: `${position.offset.x}px`,
          width: size,
          borderLeftWidth: '1px',
          borderTopLeftRadius: '0.5rem',
          borderBottomLeftRadius: '0.5rem',
          borderTopRightRadius: '0px',
          borderBottomRightRadius: '0px',
        }
    }
  }, [position])

  // Check if layout is horizontal or vertical
  const isHorizontal = position.side === 'top' || position.side === 'bottom'

  // Handle position change
  const handlePositionChange = useCallback((side: DevToolPosition['side']) => {
    onPositionChange({ side })
  }, [onPositionChange])

  // Handle plugin activation
  const handlePluginToggle = useCallback((pluginId: string) => {
    if (pluginRegistry.activePlugins.has(pluginId)) {
      pluginRegistry.deactivate(pluginId)
    } else {
      pluginRegistry.activate(pluginId)
    }
  }, [pluginRegistry])

  // Get expand icon based on position
  const getExpandIcon = () => {
    switch (position.side) {
      case 'top':
        return ChevronDown
      case 'bottom':
        return ChevronUp
      case 'left':
        return ChevronRight
      case 'right':
        return ChevronLeft
    }
  }

  const ExpandIcon = getExpandIcon()

  return (
    <TooltipProvider>
      <div
        style={barStyles}
        className={`
          flex items-center gap-2 p-2 transition-all duration-200
          ${isHorizontal ? 'flex-row justify-between' : 'flex-col justify-start'}
          ${isDragging ? 'cursor-grabbing' : 'cursor-default'}
        `}
      >
      {/* Plugin Status Indicators */}
      <div className={`
        flex gap-1 overflow-hidden
        ${isHorizontal ? 'flex-row' : 'flex-col'}
      `}>
        {activePlugins.map(plugin => (
          <Tooltip key={plugin.name}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handlePluginToggle(plugin.name)}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded text-xs
                  bg-blue-100 text-blue-800 hover:bg-blue-200
                  transition-colors duration-150
                  ${isHorizontal ? 'flex-row' : 'flex-col'}
                `}
              >
                {plugin.meta.icon && (
                  <span className="text-xs">{plugin.meta.icon}</span>
                )}
                <span className={`
                  truncate 
                  ${isHorizontal ? 'max-w-20' : 'max-w-8 text-center'}
                `}>
                  {plugin.meta.displayName}
                </span>
                {/* Badge for notifications/status */}
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  •
                </Badge>
              </button>
            </TooltipTrigger>
            <TooltipContent side={position.side === 'top' ? 'bottom' : 'top'}>
              <p>{plugin.meta.displayName}</p>
              <p className="text-xs text-muted-foreground">
                {plugin.meta.description}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Controls */}
      <div className={`
        flex gap-1
        ${isHorizontal ? 'flex-row' : 'flex-col'}
      `}>
        {/* More Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              {isHorizontal ? <MoreHorizontal size={12} /> : <MoreVertical size={12} />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side={position.side === 'top' ? 'bottom' : 'top'}>
            {/* Available Plugins */}
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Available Plugins
            </div>
            {plugins.map(plugin => (
              <DropdownMenuItem
                key={plugin.name}
                onClick={() => handlePluginToggle(plugin.name)}
                className="flex items-center gap-2"
              >
                {plugin.meta.icon && (
                  <span className="text-sm">{plugin.meta.icon}</span>
                )}
                <span className="flex-1">{plugin.meta.displayName}</span>
                {pluginRegistry.activePlugins.has(plugin.name) && (
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                )}
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            
            {/* Position Options */}
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Position
            </div>
            {positionOptions.map(option => {
              const IconComponent = option.icon
              return (
                <DropdownMenuItem
                  key={option.side}
                  onClick={() => handlePositionChange(option.side)}
                  className="flex items-center gap-2"
                >
                  <IconComponent size={14} />
                  <span>{option.label}</span>
                  {position.side === option.side && (
                    <Badge variant="secondary" className="text-xs">Current</Badge>
                  )}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Expand Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={onExpand}
            >
              <ExpandIcon size={12} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={position.side === 'top' ? 'bottom' : 'top'}>
            <p>Expand to sidebar</p>
          </TooltipContent>
        </Tooltip>

        {/* Close Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              onClick={onClose}
            >
              <X size={12} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={position.side === 'top' ? 'bottom' : 'top'}>
            <p>Close DevTools</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
    </TooltipProvider>
  )
}
