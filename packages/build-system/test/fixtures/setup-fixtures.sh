#!/bin/bash

# Bun single entry
cat > bun-single-entry/package.json << 'EOF'
{
  "name": "test-bun-single",
  "version": "0.0.1",
  "private": true
}
EOF

cat > bun-single-entry/src/index.ts << 'EOF'
export function hello() {
  return 'Hello from Bun single entry!';
}
export const version = '1.0.0';
EOF

cat > bun-single-entry/build.config.ts << 'EOF'
import { createBunBuildConfig } from '../../../src/builders/config-helpers';

export const buildConfig = createBunBuildConfig({
  name: 'test-bun-single',
  entryPoints: ['src/index.ts'],
  outDir: 'dist',
  builderOptions: {
    format: 'esm',
    target: 'node',
    minify: false,
  },
});
EOF

# Bun multi entry
cat > bun-multi-entry/package.json << 'EOF'
{
  "name": "test-bun-multi",
  "version": "0.0.1",
  "private": true
}
EOF

cat > bun-multi-entry/src/index.ts << 'EOF'
export function main() {
  return 'Main entry point';
}
EOF

cat > bun-multi-entry/src/utils.ts << 'EOF'
export function utility() {
  return 'Utility function';
}
EOF

cat > bun-multi-entry/build.config.ts << 'EOF'
import { createBunBuildConfig } from '../../../src/builders/config-helpers';

export const buildConfig = createBunBuildConfig({
  name: 'test-bun-multi',
  entryPoints: ['src/index.ts', 'src/utils.ts'],
  outDir: 'dist',
  builderOptions: {
    format: 'esm',
    target: 'node',
    splitting: true,
  },
});
EOF

# esbuild single entry
cat > esbuild-single-entry/package.json << 'EOF'
{
  "name": "test-esbuild-single",
  "version": "0.0.1",
  "private": true
}
EOF

cat > esbuild-single-entry/src/index.ts << 'EOF'
export function greet(name: string) {
  return `Hello, ${name}!`;
}
EOF

cat > esbuild-single-entry/build.config.ts << 'EOF'
import { createEsbuildBuildConfig } from '../../../src/builders/config-helpers';

export const buildConfig = createEsbuildBuildConfig({
  name: 'test-esbuild-single',
  entryPoints: ['src/index.ts'],
  outDir: 'dist',
  builderOptions: {
    bundle: true,
    platform: 'node',
    format: 'esm',
    minify: false,
  },
});
EOF

# esbuild multi entry
cat > esbuild-multi-entry/package.json << 'EOF'
{
  "name": "test-esbuild-multi",
  "version": "0.0.1",
  "private": true
}
EOF

cat > esbuild-multi-entry/src/main.ts << 'EOF'
export const app = 'Application';
EOF

cat > esbuild-multi-entry/src/lib.ts << 'EOF'
export const library = 'Library';
EOF

cat > esbuild-multi-entry/build.config.ts << 'EOF'
import { createEsbuildBuildConfig } from '../../../src/builders/config-helpers';

export const buildConfig = createEsbuildBuildConfig({
  name: 'test-esbuild-multi',
  entryPoints: ['src/main.ts', 'src/lib.ts'],
  outDir: 'dist',
  builderOptions: {
    bundle: false,
    platform: 'node',
    format: 'cjs',
  },
});
EOF

# tsc single entry
cat > tsc-single-entry/package.json << 'EOF'
{
  "name": "test-tsc-single",
  "version": "0.0.1",
  "private": true
}
EOF

cat > tsc-single-entry/src/index.ts << 'EOF'
export interface User {
  name: string;
  age: number;
}

export function createUser(name: string, age: number): User {
  return { name, age };
}
EOF

cat > tsc-single-entry/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

cat > tsc-single-entry/build.config.ts << 'EOF'
import { createTscBuildConfig } from '../../../src/builders/config-helpers';

export const buildConfig = createTscBuildConfig({
  name: 'test-tsc-single',
  outDir: 'dist',
  builderOptions: {
    declaration: true,
    sourceMap: true,
  },
});
EOF

# Rollup single entry
cat > rollup-single-entry/package.json << 'EOF'
{
  "name": "test-rollup-single",
  "version": "0.0.1",
  "private": true
}
EOF

cat > rollup-single-entry/src/index.ts << 'EOF'
export function bundle() {
  return 'Bundled with Rollup!';
}
EOF

cat > rollup-single-entry/build.config.ts << 'EOF'
import { createRollupBuildConfig } from '../../../src/builders/config-helpers';

export const buildConfig = createRollupBuildConfig({
  name: 'test-rollup-single',
  outDir: 'dist',
  builderOptions: {
    input: 'src/index.ts',
    format: 'esm',
    sourcemap: true,
  },
});
EOF

# Rollup multi entry
cat > rollup-multi-entry/package.json << 'EOF'
{
  "name": "test-rollup-multi",
  "version": "0.0.1",
  "private": true
}
EOF

cat > rollup-multi-entry/src/alpha.ts << 'EOF'
export const alpha = 'Alpha module';
EOF

cat > rollup-multi-entry/src/beta.ts << 'EOF'
export const beta = 'Beta module';
EOF

cat > rollup-multi-entry/build.config.ts << 'EOF'
import { createRollupBuildConfig } from '../../../src/builders/config-helpers';

export const buildConfig = createRollupBuildConfig({
  name: 'test-rollup-multi',
  outDir: 'dist',
  builderOptions: {
    input: {
      alpha: 'src/alpha.ts',
      beta: 'src/beta.ts',
    },
    format: 'cjs',
  },
});
EOF

echo "Fixtures created successfully!"
