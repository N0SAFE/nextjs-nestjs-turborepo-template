# Declarative Routing Enhancement Plan

## Overview
This plan outlines the enhancements to the declarative-routing package to support:
1. New properties added to `makeRoute.tsx` (Page wrapper, validation helpers)
2. New hook `useSearchParamState` in `hooks.ts`
3. Automatic generation of `layout.info.ts` files for layouts that use a wrapper pattern

## Phase 1: Update Template Files for New makeRoute.tsx Features

### 1.1 Update `assets/nextjs/makeRoute.tsx` template
**Location**: `/packages/declarative-routing/assets/nextjs/makeRoute.tsx`

**Changes needed**:
- Add the new `Page` wrapper method to RouteBuilder type
- Add validation helper methods: `validateParams`, `validateSearch`
- Update the `makeRoute` function to include these new methods
- Add proper TypeScript types for the Page component wrapper

**New exports to add**:
```typescript
export type BasePageProps = {
    children?: React.ReactNode
}

export type PageProps<Params, Search> = {
    params: Promise<z.output<Params>>
    searchParams: Promise<z.output<Search>>
} & BasePageProps

export type PageComponent<Params, Search, AdditionalProps = object> = 
    React.FC<PageProps<Params, Search> & AdditionalProps>
```

### 1.2 Update `assets/nextjs/hooks.ts` template
**Location**: `/packages/declarative-routing/assets/nextjs/hooks.ts`

**Changes needed**:
- Add the new `useSearchParamState` hook
- Add proper imports for dependencies (useSafeQueryStatesFromZod)
- Include JSDoc documentation

### 1.3 Add utils file template
**Location**: `/packages/declarative-routing/assets/nextjs/useSafeQueryStatesFromZod.ts` (new file)

**Purpose**: 
- Template for the `useSafeQueryStatesFromZod` utility that `useSearchParamState` depends on
- This should be copied during setup to the routes directory

## Phase 2: Layout.info.ts Generation System

### 2.1 Create Layout Wrapper Template
**Location**: `/packages/declarative-routing/assets/nextjs/defineLayout.ts` (new file)

**Purpose**: Template for the `defineLayout` wrapper function that users will use in their layouts

**Key features**:
```typescript
// Type definitions
type LayoutInfo<TMetadata> = {
  metadata: TMetadata
  render: () => ReactNode
}

type InfoModeParams = {
  __extractInfo: true
}

// Wrapper function
function defineLayout<TMetadata>(config: {
  metadata: TMetadata
  render: (props: LayoutProps) => ReactNode
}) {
  function layoutFunction(
    propsOrInfoMode?: LayoutProps | InfoModeParams
  ): ReactNode | LayoutInfo<TMetadata> {
    if (propsOrInfoMode?.__extractInfo === true) {
      return {
        metadata: config.metadata,
        render: () => config.render({ children: null })
      }
    }
    return config.render(propsOrInfoMode as LayoutProps)
  }
  return layoutFunction
}
```

### 2.2 Create Layout Info Template
**Location**: `/packages/declarative-routing/assets/shared/layout-info.ts.template` (new file)

**Template variables**:
```typescript
{
  layouts: [
    {
      name: string,          // e.g., "Dashboard"
      importName: string,    // e.g., "DashboardLayout"
      exportName: string,    // e.g., "default" or named export
    }
  ],
  importPath: string,       // relative path to layout.tsx
  metadataSchema: string    // name of schema to use
}
```

**Generated content**:
```typescript
import { z } from 'zod'
import { {{#each layouts}}{{{importName}}}{{#unless @last}}, {{/unless}}{{/each}} } from '{{{importPath}}}'

{{#each layouts}}
const {{name}}Info = {{importName}}({ __extractInfo: true } as any)
if (!{{name}}Info || typeof {{name}}Info !== 'object' || !('metadata' in {{name}}Info)) {
  throw new Error('{{importName}} must be wrapped with defineLayout')
}
{{/each}}

export const LayoutMetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  requiresAuth: z.boolean().optional(),
})

export const Layouts = {
{{#each layouts}}
  {{name}}: {
    name: '{{{name}}}',
    metadata: ({{name}}Info as any).metadata,
    metadataSchema: LayoutMetadataSchema,
  },
{{/each}}
}

export type LayoutMetadata = z.infer<typeof LayoutMetadataSchema>
export type LayoutsType = typeof Layouts
```

### 2.3 Update Build Tools
**Location**: `/packages/declarative-routing/src/shared/build-tools.ts`

**New function to add**: `checkLayoutFile`
```typescript
async function checkLayoutFile(layoutPath: string): Promise<boolean> {
  const config = getConfig()
  const infoFile = layoutPath.replace(/\.(js|jsx|ts|tsx)$/, ".info.ts")
  const absPath = absoluteFilePath(config, infoFile)
  
  if (!fs.existsSync(absPath)) {
    // Read layout file to check if it uses defineLayout
    const code = fs.readFileSync(absoluteFilePath(config, layoutPath)).toString()
    
    // Check if file uses defineLayout wrapper
    if (code.includes('defineLayout')) {
      await createLayoutInfoFile(config, layoutPath)
      return true
    }
  }
  return false
}
```

**New function to add**: `createLayoutInfoFile`
```typescript
async function createLayoutInfoFile(config: Config, layoutPath: string) {
  const code = fs.readFileSync(absoluteFilePath(config, layoutPath)).toString()
  const mod = parseModule(code)
  
  // Extract all exports that are layout functions
  const layouts: Array<{
    name: string,
    importName: string,
    exportName: string
  }> = []
  
  // Parse exports to find layouts wrapped with defineLayout
  // This is a simplified approach - may need AST parsing for production
  for (const [exportName, exportValue] of Object.entries(mod.exports)) {
    if (exportValue && typeof exportValue === 'object' && exportValue.name) {
      layouts.push({
        name: exportValue.name,
        importName: exportValue.name,
        exportName: exportName
      })
    }
  }
  
  if (layouts.length === 0) return
  
  const infoFile = layoutPath.replace(/\.(js|jsx|ts|tsx)$/, ".info.ts")
  const importPath = `./${path.parse(layoutPath).base}`
  
  await buildFileFromTemplate("shared/layout-info.ts.template", 
    absoluteFilePath(config, infoFile), 
    {
      layouts,
      importPath,
      metadataSchema: 'LayoutMetadataSchema'
    }
  )
}
```

**Update `buildFiles` function**:
```typescript
export async function buildFiles(silent: boolean = false) {
  const config = getConfig()

  // Existing route patterns...
  const routePatterns = [
    "**/page.{js,ts,jsx,tsx}",
    "**/route.{js,ts,jsx,tsx}",
    "page.{js,ts,jsx,tsx}",
    "route.{js,ts,jsx,tsx}"
  ]

  // NEW: Layout patterns
  const layoutPatterns = [
    "**/layout.{js,ts,jsx,tsx}",
    "layout.{js,ts,jsx,tsx}"
  ]

  // Add info files for routes (existing code)...
  
  // NEW: Add info files for layouts
  const layouts = await glob(layoutPatterns, {
    cwd: config.src,
    posix: true,
    ignore
  })

  let layoutsAdded = 0
  for (const layout of layouts) {
    if (await checkLayoutFile(layout)) {
      layoutsAdded++
    }
  }
  
  if (!silent && layoutsAdded > 0) {
    console.log(`Added ${layoutsAdded} new layout.info files`)
  }

  // Rest of existing code...
  
  return {
    routesAdded,
    routeCount,
    layoutsAdded, // NEW
    diff
  }
}
```

### 2.4 Update Setup/Init
**Location**: `/packages/declarative-routing/src/nextjs/init.ts`

**Changes in `setup` function**:
```typescript
export async function setup() {
  // ... existing code ...

  // NEW: Add defineLayout helper
  await buildFileFromTemplate(
    "nextjs/defineLayout.ts",
    path.resolve(routes, "./defineLayout.ts"),
    {}
  )
  
  // NEW: Add useSafeQueryStatesFromZod utility
  await buildFileFromTemplate(
    "nextjs/useSafeQueryStatesFromZod.ts",
    path.resolve(routes, "./useSafeQueryStatesFromZod.ts"),
    {}
  )

  // ... rest of existing code ...
}
```

## Phase 3: Documentation Updates

### 3.1 Update README template
**Location**: `/packages/declarative-routing/assets/nextjs/README.md.template`

**Add new sections**:
1. "Using Page Wrappers" - Document the new Page wrapper feature
2. "Layout Info Files" - Explain layout.info.ts generation
3. "Search Param State Management" - Document useSearchParamState hook
4. "Validation Helpers" - Document validateParams/validateSearch

### 3.2 Create Layout Guide
**Location**: `/packages/declarative-routing/docs/layouts.md` (new file)

**Content**:
- How to use defineLayout wrapper
- Benefits of layout metadata extraction
- Examples of layout configurations
- How layout.info.ts files are used

## Phase 4: Type Safety Improvements

### 4.1 Update TypeScript Definitions
Ensure all new types are properly exported and documented:
- `PageComponent`
- `PageProps`
- `BasePageProps`
- `RouteBuilderParams`
- `RouteBuilderSearch`
- Layout metadata types

## Implementation Order

1. **First**: Update template files (makeRoute.tsx, hooks.ts)
2. **Second**: Add utility file templates (defineLayout.ts, useSafeQueryStatesFromZod.ts)
3. **Third**: Create layout-info template
4. **Fourth**: Update build-tools.ts with layout detection
5. **Fifth**: Update init.ts to copy new files
6. **Sixth**: Update documentation
7. **Finally**: Test the full system

## Testing Strategy

### Manual Testing Steps:
1. Run `npx declarative-routing init` in a test Next.js project
2. Verify all new files are created
3. Create a layout using defineLayout
4. Run `npx declarative-routing build`
5. Verify layout.info.ts is generated
6. Test that route.Page wrapper works correctly
7. Test useSearchParamState hook
8. Test validation helpers

### Edge Cases to Handle:
1. Layouts without defineLayout wrapper (should be ignored)
2. Multiple layouts in one file
3. Default vs named exports
4. TypeScript vs JavaScript files
5. Layouts with complex metadata types

## Breaking Changes
None - all changes are additive and backward compatible.

## Migration Guide for Users
Not required - existing projects continue to work. New features are opt-in.

## Success Criteria
- [ ] All new template files created and tested
- [ ] Layout.info.ts generation works correctly
- [ ] Page wrapper functionality works
- [ ] useSearchParamState hook works
- [ ] Validation helpers work
- [ ] Documentation is complete
- [ ] No breaking changes to existing functionality
- [ ] TypeScript types are correct and complete
