/**
 * makeLayout.tsx - Layout builder (similar to makeRoute)
 * 
 * This creates layout builders that can be used with withLayout and useLayoutData
 */

import type { ReactNode } from 'react'
import { z } from 'zod'

// ============================================================================
// TYPES
// ============================================================================

type LayoutConfig<TData, TInnerState> = {
  ui: (renderChildren: (innerState: TInnerState) => ReactNode) => ReactNode
  data: TData
  innerState: () => TInnerState
}

export type LayoutInfo<
  Params extends z.ZodSchema,
  Data extends z.ZodSchema,
  InnerState extends z.ZodSchema,
> = {
  name: string
  params: Params
  data: Data
  innerState: InnerState
  layoutFn: (params: any) => ReactNode | LayoutConfig<any, any>
}

export type LayoutBuilder<
  Params extends z.ZodSchema,
  Data extends z.ZodSchema,
  InnerState extends z.ZodSchema,
> = {
  path: string
  name: string
  
  // Schemas
  paramsSchema: Params
  dataSchema: Data
  innerStateSchema: InnerState
  
  // Type hints
  params: z.output<Params>
  data: z.output<Data>
  innerState: z.output<InnerState>
  
  // Methods
  getConfig: (params?: z.input<Params>) => LayoutConfig<z.output<Data>, z.output<InnerState>>
  getData: (params?: z.input<Params>) => z.output<Data>
  getInnerState: (params?: z.input<Params>) => z.output<InnerState>
  
  // Layout function reference
  layoutFn: (params: any) => ReactNode | LayoutConfig<any, any>
}

// ============================================================================
// makeLayout - Creates a layout builder
// ============================================================================

export function makeLayout<
  Params extends z.ZodSchema,
  Data extends z.ZodSchema,
  InnerState extends z.ZodSchema,
>(
  path: string,
  info: LayoutInfo<Params, Data, InnerState>
): LayoutBuilder<Params, Data, InnerState> {
  
  const builder: LayoutBuilder<Params, Data, InnerState> = {
    path,
    name: info.name,
    
    paramsSchema: info.params,
    dataSchema: info.data,
    innerStateSchema: info.innerState,
    
    params: undefined as z.output<Params>,
    data: undefined as z.output<Data>,
    innerState: undefined as z.output<InnerState>,
    
    layoutFn: info.layoutFn,
    
    // Get the config without rendering UI
    getConfig: (params?: z.input<Params>) => {
      const validatedParams = info.params.parse(params || {})
      const config = info.layoutFn({ 
        children: null, 
        noUiRender: true,
        ...validatedParams 
      }) as LayoutConfig<z.output<Data>, z.output<InnerState>>
      
      return config
    },
    
    // Get just the data
    getData: (params?: z.input<Params>) => {
      const config = builder.getConfig(params)
      return config.data
    },
    
    // Get just the inner state
    getInnerState: (params?: z.input<Params>) => {
      const config = builder.getConfig(params)
      return config.innerState()
    }
  }
  
  return builder
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/*
// In routes/index.ts (auto-generated):

import { makeLayout } from './makeLayout'
import { DashboardLayoutFn, DashboardLayoutRoute } from '@/app/dashboard/layout'

export const DashboardLayout = makeLayout('/dashboard', {
  name: 'DashboardLayout',
  params: DashboardLayoutRoute.params,
  data: DashboardLayoutRoute.data,
  innerState: DashboardLayoutRoute.innerState,
  layoutFn: DashboardLayoutFn
})

// Now you can use:
const data = DashboardLayout.getData()
const innerState = DashboardLayout.getInnerState()
const config = DashboardLayout.getConfig()
*/
