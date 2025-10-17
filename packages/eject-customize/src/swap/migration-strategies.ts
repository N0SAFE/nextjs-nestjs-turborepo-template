/**
 * Framework Migration Strategies
 * Predefined migration patterns for common framework swaps
 */

import type { FrameworkType, ManualStep } from './types'

export interface MigrationStrategy {
  from: FrameworkType
  to: FrameworkType
  steps: MigrationStep[]
  complexity: 'low' | 'medium' | 'high'
  estimated_hours: number
}

export interface MigrationStep {
  category: 'routing' | 'ssr' | 'api' | 'middleware' | 'assets' | 'i18n' | 'testing' | 'build'
  description: string
  automated: boolean
  manual_steps?: ManualStep[]
  code_examples?: CodeExample[]
}

export interface CodeExample {
  before: string
  after: string
  language: string
  description: string
}

/**
 * Get predefined migration strategy for a framework swap
 */
export function getMigrationStrategy(
  from: FrameworkType,
  to: FrameworkType
): MigrationStrategy | null {
  const key = `${from}-${to}`

  const strategies: Record<string, MigrationStrategy> = {
    'nextjs-react': nextjsToReactStrategy,
    'react-nextjs': reactToNextjsStrategy,
    'vue-nuxt': vueToNuxtStrategy,
    'nuxt-vue': nuxtToVueStrategy,
    'nextjs-remix': nextjsToRemixStrategy,
    'react-vue': reactToVueStrategy,
    'vue-react': vueToReactStrategy,
    'react-solid': reactToSolidStrategy,
    'react-angular': reactToAngularStrategy,
    'vue-svelte': vueToSvelteStrategy,
  }

  return strategies[key] ?? null
}

/**
 * Next.js → React Migration Strategy
 */
const nextjsToReactStrategy: MigrationStrategy = {
  from: 'nextjs',
  to: 'react',
  complexity: 'medium',
  estimated_hours: 8,
  steps: [
    {
      category: 'routing',
      description: 'Migrate from file-based routing to React Router',
      automated: false,
      manual_steps: [
        {
          title: 'Install React Router',
          description: 'Install react-router-dom and configure routes',
          priority: 'high',
          category: 'code',
        },
        {
          title: 'Convert pages to routes',
          description:
            'Move pages/* files to src/routes/* and update to use React Router navigation',
          priority: 'high',
          category: 'code',
        },
      ],
      code_examples: [
        {
          before: `// pages/about.tsx\nexport default function About() {\n  return <div>About</div>\n}`,
          after: `// src/routes/About.tsx\nimport { Link } from 'react-router-dom'\n\nexport default function About() {\n  return <div>About <Link to="/">Home</Link></div>\n}`,
          language: 'tsx',
          description: 'Convert Next.js page to React Router route',
        },
      ],
    },
    {
      category: 'ssr',
      description: 'Replace Next.js SSR with client-side or Vite SSR',
      automated: false,
      manual_steps: [
        {
          title: 'Remove getServerSideProps',
          description: 'Replace getServerSideProps with client-side data fetching or Vite SSR',
          priority: 'high',
          category: 'code',
        },
      ],
    },
    {
      category: 'api',
      description: 'Migrate API routes to separate backend or serverless functions',
      automated: false,
      manual_steps: [
        {
          title: 'Extract API routes',
          description: 'Move pages/api/* to separate Express/Fastify server or Vercel functions',
          priority: 'medium',
          category: 'code',
        },
      ],
    },
    {
      category: 'assets',
      description: 'Update public assets and Image component',
      automated: false,
      manual_steps: [
        {
          title: 'Replace next/image',
          description: 'Replace next/image with standard img tags or custom Image component',
          priority: 'low',
          category: 'code',
        },
      ],
    },
  ],
}

/**
 * React → Next.js Migration Strategy
 */
const reactToNextjsStrategy: MigrationStrategy = {
  from: 'react',
  to: 'nextjs',
  complexity: 'medium',
  estimated_hours: 10,
  steps: [
    {
      category: 'routing',
      description: 'Migrate from React Router to Next.js file-based routing',
      automated: false,
      manual_steps: [
        {
          title: 'Convert routes to pages',
          description: 'Move routes to pages/* directory following Next.js conventions',
          priority: 'high',
          category: 'code',
        },
      ],
    },
    {
      category: 'build',
      description: 'Replace Vite/Webpack with Next.js build system',
      automated: true,
    },
    {
      category: 'ssr',
      description: 'Optionally add server-side rendering',
      automated: false,
      manual_steps: [
        {
          title: 'Identify pages for SSR',
          description: 'Determine which pages would benefit from getServerSideProps or SSG',
          priority: 'low',
          category: 'code',
        },
      ],
    },
  ],
}

/**
 * Vue → Nuxt Migration Strategy
 */
const vueToNuxtStrategy: MigrationStrategy = {
  from: 'vue',
  to: 'nuxt',
  complexity: 'low',
  estimated_hours: 4,
  steps: [
    {
      category: 'routing',
      description: 'Migrate Vue Router to Nuxt file-based routing',
      automated: false,
      manual_steps: [
        {
          title: 'Convert routes to pages',
          description: 'Move route components to pages/* directory',
          priority: 'high',
          category: 'code',
        },
      ],
    },
    {
      category: 'build',
      description: 'Replace Vite config with Nuxt config',
      automated: true,
    },
  ],
}

/**
 * Nuxt → Vue Migration Strategy
 */
const nuxtToVueStrategy: MigrationStrategy = {
  from: 'nuxt',
  to: 'vue',
  complexity: 'medium',
  estimated_hours: 6,
  steps: [
    {
      category: 'routing',
      description: 'Migrate Nuxt file-based routing to Vue Router',
      automated: false,
      manual_steps: [
        {
          title: 'Set up Vue Router',
          description: 'Install vue-router and create route configuration',
          priority: 'high',
          category: 'code',
        },
      ],
    },
    {
      category: 'ssr',
      description: 'Replace Nuxt SSR with Vue SSR or client-only',
      automated: false,
      manual_steps: [
        {
          title: 'Handle SSR dependencies',
          description: 'Remove or replace Nuxt-specific SSR features',
          priority: 'medium',
          category: 'code',
        },
      ],
    },
  ],
}

/**
 * Next.js → Remix Migration Strategy
 */
const nextjsToRemixStrategy: MigrationStrategy = {
  from: 'nextjs',
  to: 'remix',
  complexity: 'high',
  estimated_hours: 16,
  steps: [
    {
      category: 'routing',
      description: 'Convert Next.js pages to Remix routes',
      automated: false,
      manual_steps: [
        {
          title: 'Migrate to Remix routing',
          description: 'Convert pages/* to app/routes/* with Remix conventions',
          priority: 'high',
          category: 'code',
        },
      ],
    },
    {
      category: 'ssr',
      description: 'Migrate data loading from Next.js to Remix loaders',
      automated: false,
      manual_steps: [
        {
          title: 'Convert getServerSideProps to loaders',
          description: 'Replace Next.js data fetching with Remix loader functions',
          priority: 'high',
          category: 'code',
        },
      ],
    },
    {
      category: 'api',
      description: 'Migrate API routes to Remix actions/loaders',
      automated: false,
      manual_steps: [
        {
          title: 'Convert API routes',
          description: 'Move API logic to Remix action/loader functions',
          priority: 'high',
          category: 'code',
        },
      ],
    },
  ],
}

/**
 * React → Vue Migration Strategy
 */
const reactToVueStrategy: MigrationStrategy = {
  from: 'react',
  to: 'vue',
  complexity: 'high',
  estimated_hours: 20,
  steps: [
    {
      category: 'routing',
      description: 'Migrate React Router to Vue Router',
      automated: false,
      manual_steps: [
        {
          title: 'Convert to Vue Router',
          description: 'Replace React Router with Vue Router configuration',
          priority: 'high',
          category: 'code',
        },
      ],
    },
    {
      category: 'build',
      description: 'Component syntax conversion',
      automated: false,
      manual_steps: [
        {
          title: 'Convert JSX to Vue templates',
          description: 'Rewrite components from JSX to Vue SFC format',
          priority: 'high',
          category: 'code',
        },
      ],
    },
  ],
}

/**
 * Vue → React Migration Strategy
 */
const vueToReactStrategy: MigrationStrategy = {
  from: 'vue',
  to: 'react',
  complexity: 'high',
  estimated_hours: 20,
  steps: [
    {
      category: 'routing',
      description: 'Migrate Vue Router to React Router',
      automated: false,
      manual_steps: [
        {
          title: 'Convert to React Router',
          description: 'Replace Vue Router with React Router configuration',
          priority: 'high',
          category: 'code',
        },
      ],
    },
    {
      category: 'build',
      description: 'Component syntax conversion',
      automated: false,
      manual_steps: [
        {
          title: 'Convert Vue SFC to JSX',
          description: 'Rewrite components from Vue template syntax to React JSX',
          priority: 'high',
          category: 'code',
        },
      ],
    },
  ],
}

/**
 * React → Solid Migration Strategy
 */
const reactToSolidStrategy: MigrationStrategy = {
  from: 'react',
  to: 'solid',
  complexity: 'medium',
  estimated_hours: 12,
  steps: [
    {
      category: 'build',
      description: 'Convert React components to Solid',
      automated: false,
      manual_steps: [
        {
          title: 'Update component syntax',
          description: 'Replace React hooks with Solid primitives (createSignal, createEffect)',
          priority: 'high',
          category: 'code',
        },
      ],
      code_examples: [
        {
          before: `const [count, setCount] = useState(0)`,
          after: `const [count, setCount] = createSignal(0)`,
          language: 'tsx',
          description: 'Convert useState to createSignal',
        },
      ],
    },
    {
      category: 'routing',
      description: 'Migrate to Solid Router',
      automated: false,
      manual_steps: [
        {
          title: 'Convert to Solid Router',
          description: 'Replace React Router with Solid Router',
          priority: 'high',
          category: 'code',
        },
      ],
    },
  ],
}

/**
 * React → Angular Migration Strategy
 */
const reactToAngularStrategy: MigrationStrategy = {
  from: 'react',
  to: 'angular',
  complexity: 'high',
  estimated_hours: 30,
  steps: [
    {
      category: 'build',
      description: 'Complete rewrite from React to Angular',
      automated: false,
      manual_steps: [
        {
          title: 'Convert components to Angular',
          description: 'Rewrite React components as Angular components with TypeScript decorators',
          priority: 'high',
          category: 'code',
        },
      ],
    },
    {
      category: 'routing',
      description: 'Migrate to Angular Router',
      automated: false,
      manual_steps: [
        {
          title: 'Set up Angular Router',
          description: 'Configure Angular routing module',
          priority: 'high',
          category: 'code',
        },
      ],
    },
  ],
}

/**
 * Vue → Svelte Migration Strategy
 */
const vueToSvelteStrategy: MigrationStrategy = {
  from: 'vue',
  to: 'svelte',
  complexity: 'medium',
  estimated_hours: 14,
  steps: [
    {
      category: 'build',
      description: 'Convert Vue SFC to Svelte components',
      automated: false,
      manual_steps: [
        {
          title: 'Rewrite components',
          description: 'Convert Vue template/script/style to Svelte format',
          priority: 'high',
          category: 'code',
        },
      ],
    },
    {
      category: 'routing',
      description: 'Migrate to SvelteKit routing',
      automated: false,
      manual_steps: [
        {
          title: 'Set up routing',
          description: 'Configure SvelteKit file-based routing or use svelte-routing',
          priority: 'high',
          category: 'code',
        },
      ],
    },
  ],
}

/**
 * Get complexity score for a migration
 */
export function getMigrationComplexity(from: FrameworkType, to: FrameworkType): number {
  const strategy = getMigrationStrategy(from, to)

  if (!strategy) {
    // Unknown migration, assume high complexity
    return 8
  }

  const complexityMap = {
    low: 3,
    medium: 6,
    high: 9,
  }

  return complexityMap[strategy.complexity]
}

/**
 * Check if a migration path exists
 */
export function hasMigrationStrategy(from: FrameworkType, to: FrameworkType): boolean {
  return getMigrationStrategy(from, to) !== null
}

/**
 * Get all available migration paths from a framework
 */
export function getAvailableMigrationPaths(from: FrameworkType): FrameworkType[] {
  const allFrameworks: FrameworkType[] = [
    'nextjs',
    'react',
    'vue',
    'nuxt',
    'angular',
    'svelte',
    'solid',
    'qwik',
    'astro',
    'remix',
  ]

  return allFrameworks.filter(
    (to) => to !== from && to !== 'unknown' && hasMigrationStrategy(from, to)
  )
}
