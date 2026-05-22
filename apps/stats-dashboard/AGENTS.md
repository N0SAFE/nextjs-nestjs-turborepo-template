# Stats Dashboard Agent Instructions

This is the stats-dashboard app - a Next.js application for visualizing repository statistics.

## Purpose
Display real-time repository metrics and statistics, starting with code coverage visualization.

## Key Technologies
- Next.js 16.x with App Router and src/ directory structure
- TypeScript with strict mode
- Tailwind CSS 4.x for styling
- Shadcn UI components (including charts with recharts)
- Vitest for testing
- Declarative routing for type-safe navigation
- React Hook Form + Zod for forms
- Zustand (if state management needed)

## Directory Structure
```
apps/stats-dashboard/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── routes/           # Generated declarative routes
│   ├── components/       # React components
│   ├── lib/              # Utilities and configurations
│   └── hooks/            # Custom React hooks
├── scripts/              # Build and development scripts
└── (config files)        # Various configuration files
```

## Important Rules

### 1. Use src/ Directory
- **CRITICAL**: All application code must be in src/ directory
- App Router pages: `src/app/`
- Components: `src/components/`
- Routes: `src/routes/` (generated, do not edit manually)

### 2. Declarative Routing
- Create `page.info.ts` files alongside `page.tsx`
- Run `bun run generate` after route structure changes
- Import routes from `@/routes`
- Use typed route components: `<Home.Link>`, `<Coverage.Link>`, etc.
- Never use raw `href` strings

### 3. UI Components
- Use @repo/ui for shared components
- Shadcn charts for data visualization
- Import: `import { Button } from '@repo/ui'`
- Use Tailwind for custom styling

### 4. Data Fetching
- For coverage data: Read from `../../coverage/coverage-final.json`
- Create API routes in `src/app/api/`
- Use React Server Components where possible
- Use client components only when needed (state, interactivity, hooks)

### 5. Testing
- Write tests alongside components: `component.test.tsx`
- Use Vitest and React Testing Library
- Mock Next.js router/navigation in vitest.setup.ts
- Run: `bun run test` or `bun run test:coverage`

### 6. Scripts
- Development: `bun run dev` (runs entrypoint.dev.ts)
- Build: `bun run build` (generates routes → builds app)
- Test: `bun run test` or `bun run test:coverage`
- Generate routes: `bun run generate` or `bun run dr:build`
- Type-check: `bun run type-check`
- Lint: `bun run lint`

### 7. Environment Variables
- Port: `NEXT_PUBLIC_STATS_PORT=3002`
- Prefix client-side vars with `NEXT_PUBLIC_`
- Use envcli for variable interpolation in scripts

### 8. Path Aliases
- `@/` → `./src/`
- `#/` → `./` (root)
- Use these consistently in imports

### 9. Configuration Files
- **Do not manually edit**: src/routes/index.ts (generated)
- **Carefully edit**: declarative-routing.config.json (must have src: "./src/app")
- **Follow templates**: vitest.config.mts, eslint.config.ts, tailwind.config.mts

### 10. Coverage Visualization (First Feature)
- Display overall coverage percentage
- Show per-package coverage breakdown
- Use color coding:
  - Green: >75% (meets threshold)
  - Yellow: 60-75% (warning)
  - Red: <60% (critical)
- Use shadcn charts for visual representation
- Support dark mode

## Common Tasks

### Add a New Page
1. Create `src/app/your-route/page.tsx`
2. Create `src/app/your-route/page.info.ts`
3. Run `bun run generate`
4. Import route: `import { YourRoute } from '@/routes'`
5. Use: `<YourRoute.Link>`

### Add a Component
1. Create in `src/components/your-component.tsx`
2. Use TypeScript with proper types
3. Use Tailwind for styling
4. Import from @repo/ui where appropriate

### Add an API Route
1. Create `src/app/api/route-name/route.ts`
2. Export GET/POST/PUT/DELETE functions
3. Return NextResponse
4. Handle errors appropriately

### Fetch Coverage Data
```typescript
import fs from 'fs/promises'
import path from 'path'

const coveragePath = path.join(process.cwd(), '../../coverage/coverage-final.json')
const data = await fs.readFile(coveragePath, 'utf-8')
const coverage = JSON.parse(data)
```

### Use Shadcn Charts
```typescript
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@repo/ui'
import { BarChart, Bar, XAxis, YAxis } from 'recharts'

// Use in component
```

## Development Workflow

1. Start dev server: `bun run dev`
2. Make changes to components/pages
3. If route structure changed: `bun run generate`
4. Test: `bun run test`
5. Type-check: `bun run type-check`
6. Lint: `bun run lint`
7. Build: `bun run build`

## Integration with Monorepo

- Part of Turborepo monorepo
- Uses workspace catalog for dependencies
- Shares packages: @repo/ui, @repo-configs/*, @repo-bin/declarative-routing
- Port 3002 (configurable via NEXT_PUBLIC_STATS_PORT)
- Independent deployment possible

## Troubleshooting

### Routes not updating
- Run `bun run generate`
- Check declarative-routing.config.json (src: "./src/app")
- Verify page.info.ts files exist

### Type errors
- Run `bun run type-check`
- Check tsconfig.json paths configuration
- Verify imports use correct aliases

### Build failures
- Check scripts/build.ts output
- Ensure routes are generated first
- Verify all dependencies installed

### Coverage data not found
- Ensure ../../coverage/coverage-final.json exists
- Run tests with coverage in root: `bun run test:coverage`
- Check file permissions

## Next Steps

1. Create coverage overview page
2. Add API route for coverage data
3. Build visualization components
4. Add package-level drill-down
5. Add file-level details
6. Implement real-time updates (optional)
7. Add export functionality (optional)
