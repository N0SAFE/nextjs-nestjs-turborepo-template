import type { Plugin } from '../types';

export const plugins: Plugin[] = [
  // Core Plugins
  {
    id: 'base',
    name: 'Base Template',
    description: 'Next.js + NestJS foundation',
    category: 'core',
    dependencies: [],
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    description: 'TypeScript configuration',
    category: 'core',
    dependencies: ['base'],
  },
  {
    id: 'turborepo',
    name: 'Turborepo',
    description: 'Monorepo build system',
    category: 'core',
    dependencies: ['base'],
  },

  // Feature Plugins
  {
    id: 'orpc',
    name: 'ORPC',
    description: 'Type-safe RPC framework',
    category: 'feature',
    dependencies: ['base', 'typescript'],
    conflicts: ['rest-api', 'graphql'],
  },
  {
    id: 'better-auth',
    name: 'Better Auth',
    description: 'Modern authentication system',
    category: 'feature',
    dependencies: ['base', 'database'],
    optionalDependencies: ['redis', 'email'],
  },
  {
    id: 'database',
    name: 'Database',
    description: 'PostgreSQL + Drizzle ORM',
    category: 'feature',
    dependencies: ['base', 'typescript'],
  },
  {
    id: 'redis',
    name: 'Redis',
    description: 'Redis caching layer',
    category: 'feature',
    dependencies: ['base'],
  },
  {
    id: 'job-queue',
    name: 'Job Queue',
    description: 'Bull queue system',
    category: 'feature',
    dependencies: ['redis'],
  },
  {
    id: 'event-system',
    name: 'Event System',
    description: 'Event-driven architecture',
    category: 'feature',
    dependencies: ['base'],
    optionalDependencies: ['redis'],
  },
  {
    id: 'file-upload',
    name: 'File Upload',
    description: 'File management system',
    category: 'feature',
    dependencies: ['base'],
  },
  {
    id: 'email',
    name: 'Email Service',
    description: 'Email service integration',
    category: 'feature',
    dependencies: ['base'],
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Webhook management',
    category: 'feature',
    dependencies: ['base', 'database'],
  },
  {
    id: 'search',
    name: 'Search',
    description: 'Full-text search',
    category: 'feature',
    dependencies: ['database'],
  },
  {
    id: 'i18n',
    name: 'i18n',
    description: 'Internationalization',
    category: 'feature',
    dependencies: ['base'],
  },

  // Infrastructure Plugins
  {
    id: 'docker',
    name: 'Docker',
    description: 'Docker containerization',
    category: 'infrastructure',
    dependencies: ['base'],
  },
  {
    id: 'ci-cd',
    name: 'CI/CD',
    description: 'GitHub Actions workflows',
    category: 'infrastructure',
    dependencies: ['base'],
  },
  {
    id: 'monitoring',
    name: 'Monitoring',
    description: 'Application monitoring',
    category: 'infrastructure',
    dependencies: ['base'],
  },
  {
    id: 'testing',
    name: 'Testing',
    description: 'Testing framework',
    category: 'infrastructure',
    dependencies: ['base', 'typescript'],
  },

  // UI Plugins
  {
    id: 'shadcn-ui',
    name: 'Shadcn UI',
    description: 'UI component library',
    category: 'ui',
    dependencies: ['base', 'tailwind'],
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    description: 'Utility-first CSS',
    category: 'ui',
    dependencies: ['base'],
  },
  {
    id: 'theme',
    name: 'Theme System',
    description: 'Dark mode support',
    category: 'ui',
    dependencies: ['base', 'tailwind'],
  },

  // Integration Plugins
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Stripe payments',
    category: 'integration',
    dependencies: ['base'],
    optionalDependencies: ['database', 'webhooks'],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Analytics integration',
    category: 'integration',
    dependencies: ['base'],
  },
  {
    id: 'seo',
    name: 'SEO',
    description: 'SEO optimization',
    category: 'integration',
    dependencies: ['base'],
  },
];
