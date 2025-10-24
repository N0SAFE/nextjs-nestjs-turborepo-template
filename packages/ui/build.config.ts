import { createBunBuildConfig } from '@repo/build-system';

export const buildConfig = createBunBuildConfig({
  name: '@repo/ui',
  friendlyName: 'UI Components',
  entryPoints: ['index.ts'],
  outDir: 'dist',
  builderOptions: {
    format: 'esm',
    target: 'browser',
    sourcemap: 'external',
    minify: false,
    splitting: true,
    external: [
      'react',
      'react-dom',
      'next',
      '@radix-ui/*',
      'framer-motion',
      'lucide-react',
      'next-themes',
      'react-hook-form',
      'zod',
      '@hookform/resolvers',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'sonner',
      'cmdk',
    ],
  },
  artifactGlobs: ['dist/**/*.js', 'dist/**/*.d.ts', 'dist/**/*.map', 'dist/**/*.css'],
  cache: {
    include: ['**/*.ts', '**/*.tsx', '**/*.css', 'package.json', 'components.json'],
    exclude: ['node_modules/**', 'dist/**', '**/*.test.ts', '**/*.test.tsx'],
    strategy: 'content-hash',
  },
});
