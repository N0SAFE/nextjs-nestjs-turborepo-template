import { Injectable } from '@nestjs/common';
import { Tool, Resource, ResourceTemplate, Prompt } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

type PackageInfo = {
  name: string;
  path: string;
  private?: boolean;
  version?: string;
};

@Injectable()
export class RepoTools {
  private async findRepoRoot(): Promise<string> {
    // Start from this file's directory (handling ESM import.meta.url) and crawl up until a package.json with workspaces is found
    const here = path.dirname(new URL(import.meta.url).pathname);
    let dir = here;
    for (let i = 0; i < 8; i++) {
      const pkgPath = path.join(dir, 'package.json');
      const pkg = await this.readJson<any>(pkgPath);
      if (pkg?.workspaces?.packages?.includes?.('apps/*') && pkg.workspaces.packages.includes('packages/*')) {
        return dir;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    // Fallback to process.cwd() if not found
    return process.cwd();
  }

  private async readJson<T = any>(file: string): Promise<T | null> {
    try {
      const data = await fs.readFile(file, 'utf-8');
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  private async writeJson(file: string, data: any): Promise<void> {
    await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  }

  private async listDirs(absolutePath: string): Promise<string[]> {
    const items = await fs.readdir(absolutePath, { withFileTypes: true });
    return items.filter((i) => i.isDirectory()).map((i) => path.join(absolutePath, i.name));
  }

  private async readAgentsForDir(dir: string): Promise<{ path: string; content: string } | null> {
    const file = path.join(dir, 'AGENTS.md');
    try {
      const content = await fs.readFile(file, 'utf-8');
      return { path: file, content };
    } catch {
      return null;
    }
  }

  private async findAgentsIndex() {
    const { repoRoot, appsDir, packagesDir } = await this.getWorkspace();
    const results: Array<{ scope: string; path: string }> = [];
    // Root AGENTS.md
    const rootAgents = path.join(repoRoot, 'AGENTS.md');
    try {
      await fs.access(rootAgents);
      results.push({ scope: 'root', path: rootAgents });
    } catch {}
    // Apps
    const appDirs = await this.listDirs(appsDir).catch(() => []);
    for (const dir of appDirs) {
      const file = path.join(dir, 'AGENTS.md');
      try {
        await fs.access(file);
        results.push({ scope: `apps/${path.basename(dir)}`, path: file });
      } catch {}
    }
    // Packages
    const pkgDirs = await this.listDirs(packagesDir).catch(() => []);
    for (const dir of pkgDirs) {
      const file = path.join(dir, 'AGENTS.md');
      try {
        await fs.access(file);
        results.push({ scope: `packages/${path.basename(dir)}`, path: file });
      } catch {}
    }
    return results.sort((a, b) => a.scope.localeCompare(b.scope));
  }

  private async getWorkspace() {
    const repoRoot = await this.findRepoRoot();
    const appsDir = path.join(repoRoot, 'apps');
    const packagesDir = path.join(repoRoot, 'packages');
    const apps = await this.collectPackages(appsDir);
    const packages = await this.collectPackages(packagesDir);
    const internalNames = new Set<string>([...apps, ...packages].map((p) => p.name));
    return { repoRoot, appsDir, packagesDir, apps, packages, internalNames };
  }

  private async findTarget(
    type: 'app' | 'package',
    name: string,
  ): Promise<{ info: PackageInfo; pkg: any; pkgPath: string } | null> {
    const { apps, packages } = await this.getWorkspace();
    const list = type === 'app' ? apps : packages;
    const info = list.find((p) => p.name === name);
    if (!info) return null;
    const pkgPath = path.join(info.path, 'package.json');
    const pkg = await this.readJson<any>(pkgPath);
    if (!pkg) return null;
    return { info, pkg, pkgPath };
  }

  private bumpVersionStr(version: string, release: 'patch' | 'minor' | 'major' | 'prerelease', preid?: string) {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
    if (!match) return version;
    const M = match[1];
    const m = match[2];
    const p = match[3];
    let pre: string | undefined = match[4];
    let major = parseInt(M, 10);
    let minor = parseInt(m, 10);
    let patch = parseInt(p, 10);
    if (release === 'major') {
      major += 1;
      minor = 0;
      patch = 0;
      pre = undefined;
    } else if (release === 'minor') {
      minor += 1;
      patch = 0;
      pre = undefined;
    } else if (release === 'patch') {
      patch += 1;
      pre = undefined;
    } else if (release === 'prerelease') {
      const id = preid ?? 'rc';
      if (pre && pre.startsWith(id)) {
        const parts = pre.split('.');
        const last = parseInt(parts[1] ?? '0', 10) + 1;
        pre = `${id}.${last}`;
      } else {
        pre = `${id}.0`;
      }
    }
    return `${major}.${minor}.${patch}${pre ? '-' + pre : ''}`;
  }

  private async collectPackages(baseDir: string): Promise<PackageInfo[]> {
    const dirs = await this.listDirs(baseDir).catch(() => []);
    const results: PackageInfo[] = [];
    for (const dir of dirs) {
      const pkgPath = path.join(dir, 'package.json');
      const pkg = await this.readJson<any>(pkgPath);
      if (pkg?.name) {
        results.push({ name: pkg.name, path: dir, private: pkg.private, version: pkg.version });
      }
    }
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  @Tool({
    name: 'list-apps',
    description: 'List all applications under apps/* with their name and path.',
  })
  async listApps(_: unknown, context: Context) {
    const { repoRoot, appsDir, apps, packages, internalNames } = await this.getWorkspace();
    const all = [...apps, ...packages];
    const results = [] as Array<
      PackageInfo & {
        scripts: string[];
        dependencyCount: number;
        devDependencyCount: number;
        internalUses: string[];
        usedBy: string[];
        agent?: { path: string; content: string } | null;
      }
    >;

    for (const app of apps) {
      const pkg = await this.readJson<any>(path.join(app.path, 'package.json'));
      const scripts = Object.keys(pkg?.scripts ?? {});
      const deps = Object.keys({ ...(pkg?.dependencies ?? {}), ...(pkg?.peerDependencies ?? {}) });
      const devDeps = Object.keys(pkg?.devDependencies ?? {});
      const internalUses = deps.filter((d) => internalNames.has(d));

      const usedBy: string[] = [];
      for (const p of all) {
        if (p.name === app.name) continue;
        const pj = await this.readJson<any>(path.join(p.path, 'package.json'));
        const alldeps = { ...(pj?.dependencies ?? {}), ...(pj?.peerDependencies ?? {}) };
        if (alldeps[app.name]) usedBy.push(p.name);
      }

      const agent = await this.readAgentsForDir(app.path);

      results.push({
        ...app,
        scripts,
        dependencyCount: deps.length,
        devDependencyCount: devDeps.length,
        internalUses,
        usedBy,
        agent,
      });
    }

    await context.reportProgress({ progress: 100, total: 100 });
    return results;
  }

  @Tool({
    name: 'list-packages',
    description: 'List all packages under packages/* with their name and path.',
  })
  async listPackages(_: unknown, context: Context) {
    const { packages, apps, internalNames, packagesDir } = await this.getWorkspace();
    const all = [...apps, ...packages];
    const results = [] as Array<
      PackageInfo & {
        scripts: string[];
        dependencyCount: number;
        devDependencyCount: number;
        internalUses: string[];
        usedBy: string[];
        agent?: { path: string; content: string } | null;
      }
    >;

    for (const pkgInfo of packages) {
      const pkg = await this.readJson<any>(path.join(pkgInfo.path, 'package.json'));
      const scripts = Object.keys(pkg?.scripts ?? {});
      const deps = Object.keys({ ...(pkg?.dependencies ?? {}), ...(pkg?.peerDependencies ?? {}) });
      const devDeps = Object.keys(pkg?.devDependencies ?? {});
      const internalUses = deps.filter((d) => internalNames.has(d));

      const usedBy: string[] = [];
      for (const p of all) {
        if (p.name === pkgInfo.name) continue;
        const pj = await this.readJson<any>(path.join(p.path, 'package.json'));
        const alldeps = { ...(pj?.dependencies ?? {}), ...(pj?.peerDependencies ?? {}) };
        if (alldeps[pkgInfo.name]) usedBy.push(p.name);
      }

      const agent = await this.readAgentsForDir(pkgInfo.path);

      results.push({
        ...pkgInfo,
        scripts,
        dependencyCount: deps.length,
        devDependencyCount: devDeps.length,
        internalUses,
        usedBy,
        agent,
      });
    }

    await context.reportProgress({ progress: 100, total: 100 });
    return results;
  }

  private extractDeps(pkg: any) {
    const deps = Object.entries({ ...(pkg?.dependencies ?? {}), ...(pkg?.peerDependencies ?? {}) })
      .map(([name, version]) => ({ name, version }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const devDeps = Object.entries(pkg?.devDependencies ?? {})
      .map(([name, version]) => ({ name, version }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { deps, devDeps };
  }

  @Tool({
    name: 'show-app-dependencies',
    description: 'Show dependencies for the given app name (matches package.json name).',
    parameters: z.object({
      name: z.string().describe('The app package name, e.g., "api" or scoped name if any.'),
    }),
  } as any)
  async showAppDependencies({ name }: { name: string }) {
  const repoRoot = await this.findRepoRoot();
  const appsDir = path.join(repoRoot, 'apps');
    const apps = await this.collectPackages(appsDir);
    const app = apps.find((a) => a.name === name);
    if (!app) return { error: `App not found: ${name}` };
    const pkg = await this.readJson<any>(path.join(app.path, 'package.json'));
    if (!pkg) return { error: 'package.json missing' };
    const { deps, devDeps } = this.extractDeps(pkg);
    return { name: pkg.name, path: app.path, version: pkg.version, dependencies: deps, devDependencies: devDeps };
  }

  @Tool({
    name: 'show-package-dependencies',
    description: 'Show dependencies for the given workspace package name (under packages/*).',
    parameters: z.object({
      name: z.string().describe('The package name, e.g., "@repo/ui"'),
    }),
  } as any)
  async showPackageDependencies({ name }: { name: string }) {
  const repoRoot = await this.findRepoRoot();
  const packagesDir = path.join(repoRoot, 'packages');
    const pkgs = await this.collectPackages(packagesDir);
    const pkgInfo = pkgs.find((p) => p.name === name);
    if (!pkgInfo) return { error: `Package not found: ${name}` };
    const pkg = await this.readJson<any>(path.join(pkgInfo.path, 'package.json'));
    if (!pkg) return { error: 'package.json missing' };
    const { deps, devDeps } = this.extractDeps(pkg);
    return { name: pkg.name, path: pkgInfo.path, version: pkg.version, dependencies: deps, devDependencies: devDeps };
  }

  @Tool({
    name: 'create-app',
    description:
      'Create a new app under apps/. Supports default template or running a CLI like create-next-app. Returns location on success.',
    parameters: z.object({
      appName: z.string().min(1).describe('Folder name under apps/'),
      template: z
        .enum(['none', 'nextjs'])
        .default('nextjs')
        .describe('Creation strategy: nextjs uses create-next-app, none creates empty package'),
      cliFlags: z
        .array(z.string())
        .optional()
        .describe('Extra flags to pass to the CLI when template is nextjs'),
    }),
  } as any)
  async createApp(
    { appName, template, cliFlags }: { appName: string; template: 'none' | 'nextjs'; cliFlags?: string[] },
    context: Context,
  ) {
  const repoRoot = await this.findRepoRoot();
  const appsDir = path.join(repoRoot, 'apps');
    const targetDir = path.join(appsDir, appName);
    // Basic existence check
    try {
      await fs.access(targetDir);
      return { error: `Directory already exists: ${targetDir}` };
    } catch {}

    await fs.mkdir(targetDir, { recursive: true });
    await context.reportProgress({ progress: 10, total: 100, label: 'Directory created' });

    if (template === 'nextjs') {
      // Run create-next-app in targetDir's parent specifying dir name
      const cmd = 'bun';
      const args = ['x', 'create-next-app@latest', appName, ...(cliFlags ?? [])];
      await this.runCommand(cmd, args, appsDir, context, 'Scaffolding Next.js app');
    } else {
      // Minimal package.json
      const pkg = {
        name: appName,
        version: '0.1.0',
        private: true,
        scripts: { dev: 'echo "No dev script"', build: 'echo "No build"' },
      };
      await fs.writeFile(path.join(targetDir, 'package.json'), JSON.stringify(pkg, null, 2), 'utf-8');
      await context.reportProgress({ progress: 70, total: 100, label: 'Empty app package.json created' });
    }

    await context.reportProgress({ progress: 100, total: 100, label: 'App created' });
    return { created: true, path: targetDir };
  }

  @Tool({
    name: 'create-package',
    description:
      'Create a new workspace package under packages/. Creates a minimal TypeScript package with tsconfig and build script.',
    parameters: z.object({
      packageName: z.string().min(1).describe('The package name. Use scope like @repo/xyz when applicable.'),
      folderName: z
        .string()
        .min(1)
        .describe('Folder name under packages/. If omitted and package is scoped, use the part after the scope.')
        .optional(),
    }),
  } as any)
  async createPackage(
    { packageName, folderName }: { packageName: string; folderName?: string },
    context: Context,
  ) {
  const repoRoot = await this.findRepoRoot();
  const packagesDir = path.join(repoRoot, 'packages');
    const finalFolder = folderName ?? packageName.replace(/^@[^/]+\//, '');
    const targetDir = path.join(packagesDir, finalFolder);
    try {
      await fs.access(targetDir);
      return { error: `Directory already exists: ${targetDir}` };
    } catch {}

    await fs.mkdir(path.join(targetDir, 'src'), { recursive: true });
    await context.reportProgress({ progress: 10, total: 100, label: 'Directory created' });

    const pkg = {
      name: packageName,
      version: '0.1.0',
      type: 'module',
      main: './dist/index.js',
      types: './dist/index.d.ts',
      scripts: {
        build: 'tsc -p tsconfig.json',
        dev: 'tsx watch src/index.ts',
        test: 'vitest run',
        'test:watch': 'vitest',
        clean: 'rimraf dist',
        'type-check': 'tsc --noEmit',
      },
      dependencies: {},
      devDependencies: {
        '@repo/tsconfig': 'workspace:*',
        typescript: 'catalog:build',
        vitest: 'catalog:testing',
        '@types/node': 'catalog:build',
        tsx: '^4.16.2',
        rimraf: 'catalog:build',
      },
    };
    await fs.writeFile(path.join(targetDir, 'package.json'), JSON.stringify(pkg, null, 2), 'utf-8');
    const tsconfig = {
      extends: '@repo/tsconfig/base.json',
      compilerOptions: {
        target: 'ES2022',
        module: 'ES2022',
        moduleResolution: 'bundler',
        outDir: './dist',
        declaration: true,
        declarationMap: true,
        noEmit: false,
        strict: true,
        types: ['node'],
      },
      include: ['src/**/*.ts'],
      exclude: ['node_modules', 'dist'],
    } as any;
    await fs.writeFile(path.join(targetDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2), 'utf-8');
    await fs.writeFile(path.join(targetDir, 'src/index.ts'), 'export const hello = () => "hello";\n', 'utf-8');

    await context.reportProgress({ progress: 100, total: 100, label: 'Package created' });
    return { created: true, path: targetDir };
  }

  private runCommand(cmd: string, args: string[], cwd: string, context: Context, label?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], shell: false });
      child.stdout.on('data', async () => {
        await context.reportProgress({ progress: 50, total: 100, label });
      });
      let stderr = '';
      child.stderr.on('data', (d) => {
        stderr += d.toString();
      });
      child.on('error', (err) => reject(err));
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Command failed (${cmd} ${args.join(' ')}): ${stderr}`));
      });
    });
  }

  // Lightweight command runner that captures stdout/stderr (used for git and non-progress flows)
  private runCmdCapture(cmd: string, args: string[], cwd: string): Promise<{ code: number; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], shell: false });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => (stdout += d.toString()));
      child.stderr.on('data', (d) => (stderr += d.toString()));
      child.on('error', (err) => resolve({ code: 1, stdout: '', stderr: String(err) }));
      child.on('close', (code) => resolve({ code: code ?? 0, stdout, stderr }));
    });
  }

  // ============
  // MCP Resources
  // ============

  @Resource({
    name: 'repo-summary',
    uri: 'repo://summary',
    description: 'High-level summary of repository apps and packages',
    mimeType: 'application/json',
  })
  async resourceRepoSummary() {
    const { apps, packages } = await this.getWorkspace();
    const payload = {
      apps: apps.map((a) => ({ name: a.name, path: a.path, version: a.version })),
      packages: packages.map((p) => ({ name: p.name, path: p.path, version: p.version })),
      totals: { apps: apps.length, packages: packages.length },
    };
    return {
      contents: [
        {
          uri: 'repo://summary',
          mimeType: 'application/json',
          text: JSON.stringify(payload, null, 2),
        },
      ],
    };
  }

  @Resource({
    name: 'repo-apps',
    uri: 'repo://apps',
    description: 'List all apps in the repo',
    mimeType: 'application/json',
  })
  async resourceApps() {
    const { apps } = await this.getWorkspace();
    return {
      contents: [
        {
          uri: 'repo://apps',
          mimeType: 'application/json',
          text: JSON.stringify(apps, null, 2),
        },
      ],
    };
  }

  @Resource({
    name: 'repo-packages',
    uri: 'repo://packages',
    description: 'List all packages in the repo',
    mimeType: 'application/json',
  })
  async resourcePackages() {
    const { packages } = await this.getWorkspace();
    return {
      contents: [
        {
          uri: 'repo://packages',
          mimeType: 'application/json',
          text: JSON.stringify(packages, null, 2),
        },
      ],
    };
  }

  // ============================
  // Turbo tasks & Commit planning
  // ============================

  @Resource({
    name: 'turbo-tasks',
    uri: 'repo://turbo/tasks',
    description: 'Summaries of turbo.json pipeline tasks and per-target script availability across the workspace',
    mimeType: 'application/json',
  })
  async resourceTurboTasks() {
    const { repoRoot, apps, packages } = await this.getWorkspace();
    const turbo = (await this.readJson<any>(path.join(repoRoot, 'turbo.json'))) ?? {};
    const pipeline = turbo?.pipeline ?? {};
    const taskNames = Object.keys(pipeline);

    const rootPkg = (await this.readJson<any>(path.join(repoRoot, 'package.json'))) ?? {};
    const targets = [
      ...apps.map((t) => ({ ...t, kind: 'app' as const })),
      ...packages.map((t) => ({ ...t, kind: 'package' as const })),
      { name: 'root', path: repoRoot, private: rootPkg?.private, version: rootPkg?.version, kind: 'root' as const },
    ];

    const perTarget = [] as Array<{
      name: string;
      kind: 'root' | 'app' | 'package';
      scripts: string[];
      taskAvailability: Record<string, boolean>;
      missingTasks: string[];
    }>;

    for (const t of targets) {
      const pkg = (await this.readJson<any>(path.join(t.path, 'package.json'))) ?? {};
      const scripts = Object.keys(pkg?.scripts ?? {});
      const taskAvailability: Record<string, boolean> = {};
      for (const tn of taskNames) taskAvailability[tn] = scripts.includes(tn);
      const missingTasks = taskNames.filter((tn) => !taskAvailability[tn]);
      perTarget.push({ name: t.name, kind: t.kind, scripts, taskAvailability, missingTasks });
    }

    const payload = { hasTurbo: !!taskNames.length, tasks: taskNames, pipeline, perTarget };
    return {
      contents: [
        { uri: 'repo://turbo/tasks', mimeType: 'application/json', text: JSON.stringify(payload, null, 2) },
      ],
    };
  }

  @Resource({
    name: 'commit-plan',
    uri: 'repo://commit/plan',
    description: 'Recommended sequence to lint, type-check, and build the repo before committing',
    mimeType: 'application/json',
  })
  async resourceCommitPlan() {
    const { repoRoot, apps, packages } = await this.getWorkspace();
    const turbo = (await this.readJson<any>(path.join(repoRoot, 'turbo.json'))) ?? {};
    const pipeline = turbo?.pipeline ?? {};
    const tasksPreferred = ['lint', 'type-check', 'build'];
    const turboTasks = tasksPreferred.filter((t) => pipeline[t]);
    const canUseTurbo = turboTasks.length > 0;

    const recommended = [] as Array<{ label: string; command: string; cwd: string }>;
    if (canUseTurbo) {
      recommended.push({
        label: 'Run repo-wide checks with Turbo',
        command: `bunx turbo run ${turboTasks.join(' ')}`,
        cwd: repoRoot,
      });
    } else {
      // Fallback to root scripts if present
      const rootPkg = (await this.readJson<any>(path.join(repoRoot, 'package.json'))) ?? {};
      const rootScripts = Object.keys(rootPkg?.scripts ?? {});
      for (const t of tasksPreferred) {
        if (rootScripts.includes(t)) recommended.push({ label: `Run ${t} at root`, command: `bun --bun run ${t}`, cwd: repoRoot });
      }
    }

    // Per-target fallback hints
    const perTarget = [] as Array<{
      name: string;
      kind: 'app' | 'package';
      scriptsPresent: { lint: boolean; typeCheck: boolean; build: boolean };
    }>;
    for (const t of [...apps.map((x) => ({ ...x, kind: 'app' as const })), ...packages.map((x) => ({ ...x, kind: 'package' as const }))]) {
      const pkg = (await this.readJson<any>(path.join(t.path, 'package.json'))) ?? {};
      const scripts = Object.keys(pkg?.scripts ?? {});
      perTarget.push({
        name: t.name,
        kind: t.kind,
        scriptsPresent: {
          lint: scripts.includes('lint'),
          typeCheck: scripts.includes('type-check'),
          build: scripts.includes('build'),
        },
      });
    }

    const payload = { canUseTurbo, turboTasks, recommended, perTarget };
    return { contents: [{ uri: 'repo://commit/plan', mimeType: 'application/json', text: JSON.stringify(payload, null, 2) }] };
  }

  @Tool({
    name: 'list-agents',
    description:
      'List all AGENTS.md files across the repo: root, apps/*, packages/* with their scopes and paths.',
  })
  async listAgents() {
    const index = await this.findAgentsIndex();
    return index;
  }

  @Resource({
    name: 'repo-agents',
    uri: 'repo://agents',
    description: 'JSON index of all AGENTS.md files in the repo',
    mimeType: 'application/json',
  })
  async resourceAgents() {
    const index = await this.findAgentsIndex();
    return {
      contents: [
        { uri: 'repo://agents', mimeType: 'application/json', text: JSON.stringify(index, null, 2) },
      ],
    };
  }

  @ResourceTemplate({
    name: 'repo-agent-by-scope',
    uriTemplate: 'repo://agent/{scope}',
    description:
      'Fetch the content of an AGENTS.md for a given scope: use "root" or names like apps/web or packages/ui',
    mimeType: 'text/markdown',
  })
  async resourceAgentByScope(params: { scope: string }) {
    const index = await this.findAgentsIndex();
    const item = index.find((i) => i.scope === params.scope);
    const uri = `repo://agent/${params.scope}`;
    if (!item) {
      return { contents: [{ uri, mimeType: 'text/plain', text: `AGENTS.md not found for scope: ${params.scope}` }], isError: true };
    }
    const text = await fs.readFile(item.path, 'utf-8').catch(() => null);
    if (!text)
      return { contents: [{ uri, mimeType: 'text/plain', text: `Unable to read file: ${item.path}` }], isError: true };
    return { contents: [{ uri, mimeType: 'text/markdown', text }] };
  }

  @ResourceTemplate({
    name: 'app-dependencies',
    uriTemplate: 'repo://app/{name}/dependencies',
    description: 'Dependencies for a given app',
    mimeType: 'application/json',
  })
  async resourceAppDependencies(params: { name: string }) {
    const { apps } = await this.getWorkspace();
    const app = apps.find((a) => a.name === params.name);
    if (!app) {
      return {
        contents: [
          {
            uri: `repo://app/${params.name}/dependencies`,
            mimeType: 'text/plain',
            text: `App not found: ${params.name}`,
          },
        ],
        isError: true,
      };
    }
    const pkg = await this.readJson<any>(path.join(app.path, 'package.json'));
    const { deps, devDeps } = this.extractDeps(pkg ?? {});
    const payload = { name: app.name, dependencies: deps, devDependencies: devDeps };
    return {
      contents: [
        {
          uri: `repo://app/${params.name}/dependencies`,
          mimeType: 'application/json',
          text: JSON.stringify(payload, null, 2),
        },
      ],
    };
  }

  @ResourceTemplate({
    name: 'package-dependencies',
    uriTemplate: 'repo://package/{name}/dependencies',
    description: 'Dependencies for a given package',
    mimeType: 'application/json',
  })
  async resourcePackageDependencies(params: { name: string }) {
    const { packages } = await this.getWorkspace();
    const pkgInfo = packages.find((p) => p.name === params.name);
    if (!pkgInfo) {
      return {
        contents: [
          {
            uri: `repo://package/${params.name}/dependencies`,
            mimeType: 'text/plain',
            text: `Package not found: ${params.name}`,
          },
        ],
        isError: true,
      };
    }
    const pkg = await this.readJson<any>(path.join(pkgInfo.path, 'package.json'));
    const { deps, devDeps } = this.extractDeps(pkg ?? {});
    const payload = { name: pkgInfo.name, dependencies: deps, devDependencies: devDeps };
    return {
      contents: [
        {
          uri: `repo://package/${params.name}/dependencies`,
          mimeType: 'application/json',
          text: JSON.stringify(payload, null, 2),
        },
      ],
    };
  }

  @ResourceTemplate({
    name: 'app-package-json',
    uriTemplate: 'repo://app/{name}/package.json',
    description: 'Raw package.json for the given app',
    mimeType: 'application/json',
  })
  async resourceAppPackageJson(params: { name: string }) {
    const { apps } = await this.getWorkspace();
    const app = apps.find((a) => a.name === params.name);
    const uri = `repo://app/${params.name}/package.json`;
    if (!app) {
      return { contents: [{ uri, mimeType: 'text/plain', text: `App not found: ${params.name}` }], isError: true };
    }
    const content = await fs.readFile(path.join(app.path, 'package.json'), 'utf-8').catch(() => null);
    if (!content) return { contents: [{ uri, mimeType: 'text/plain', text: 'package.json missing' }], isError: true };
    return { contents: [{ uri, mimeType: 'application/json', text: content }] };
  }

  // =====================
  // Git changes & summaries
  // =====================

  @Resource({
    name: 'repo-changes',
    uri: 'repo://changes',
    description: 'List of changed files (staged and unstaged) using git, with basic status codes',
    mimeType: 'application/json',
  })
  async resourceRepoChanges() {
    const { repoRoot } = await this.getWorkspace();
    const changed: Array<{ path: string; status: string; staged: boolean; from?: string; to?: string }> = [];

    const parseNameStatus = (stdout: string, staged: boolean) => {
      for (const line of stdout.split('\n')) {
        if (!line.trim()) continue;
        const parts = line.split('\t');
        const code = parts[0];
        if (!code) continue;
        if (code.startsWith('R')) {
          const from = parts[1];
          const to = parts[2] ?? from;
          changed.push({ path: to, status: 'R', staged, from, to });
        } else {
          const status = code.trim();
          const p = parts[1] ?? '';
          changed.push({ path: p, status, staged });
        }
      }
    };

    const unstaged = await this.runCmdCapture('git', ['diff', '--name-status'], repoRoot);
    if (unstaged.code === 0) parseNameStatus(unstaged.stdout, false);

    const staged = await this.runCmdCapture('git', ['diff', '--cached', '--name-status'], repoRoot);
    if (staged.code === 0) parseNameStatus(staged.stdout, true);

    const untracked = await this.runCmdCapture('git', ['ls-files', '--others', '--exclude-standard'], repoRoot);
    if (untracked.code === 0) {
      for (const line of untracked.stdout.split('\n')) {
        if (!line.trim()) continue;
        changed.push({ path: line.trim(), status: '??', staged: false });
      }
    }

    const payload = { count: changed.length, changed };
    return { contents: [{ uri: 'repo://changes', mimeType: 'application/json', text: JSON.stringify(payload, null, 2) }] };
  }

  @ResourceTemplate({
    name: 'diff-summary-by-path',
    uriTemplate: 'repo://diff-summary/{path}',
    description: 'Diff summary (added/deleted lines) for a specific path, staged and unstaged',
    mimeType: 'application/json',
  })
  async resourceDiffSummaryByPath(params: { path: string }) {
    const { repoRoot } = await this.getWorkspace();
    const targetPath = params.path;

    const parseNumstat = (stdout: string) => {
      let added = 0;
      let deleted = 0;
      for (const line of stdout.split('\n')) {
        if (!line.trim()) continue;
        const parts = line.split('\t');
        const a = parseInt(parts[0] ?? '0', 10);
        const d = parseInt(parts[1] ?? '0', 10);
        if (!Number.isNaN(a)) added += a;
        if (!Number.isNaN(d)) deleted += d;
      }
      return { added, deleted };
    };

    const unstaged = await this.runCmdCapture('git', ['diff', '--numstat', '--', targetPath], repoRoot);
    const staged = await this.runCmdCapture('git', ['diff', '--cached', '--numstat', '--', targetPath], repoRoot);
    const payload = {
      path: targetPath,
      unstaged: unstaged.code === 0 ? parseNumstat(unstaged.stdout) : { added: 0, deleted: 0 },
      staged: staged.code === 0 ? parseNumstat(staged.stdout) : { added: 0, deleted: 0 },
    };
    return {
      contents: [
        { uri: `repo://diff-summary/${targetPath}`, mimeType: 'application/json', text: JSON.stringify(payload, null, 2) },
      ],
    };
  }

  @ResourceTemplate({
    name: 'package-package-json',
    uriTemplate: 'repo://package/{name}/package.json',
    description: 'Raw package.json for the given package',
    mimeType: 'application/json',
  })
  async resourcePackagePackageJson(params: { name: string }) {
    const { packages } = await this.getWorkspace();
    const pkgInfo = packages.find((p) => p.name === params.name);
    const uri = `repo://package/${params.name}/package.json`;
    if (!pkgInfo)
      return { contents: [{ uri, mimeType: 'text/plain', text: `Package not found: ${params.name}` }], isError: true };
    const content = await fs.readFile(path.join(pkgInfo.path, 'package.json'), 'utf-8').catch(() => null);
    if (!content) return { contents: [{ uri, mimeType: 'text/plain', text: 'package.json missing' }], isError: true };
    return { contents: [{ uri, mimeType: 'application/json', text: content }] };
  }

  @ResourceTemplate({
    name: 'graph-uses',
    uriTemplate: 'repo://graph/uses/{name}',
    description: 'List internal workspace dependencies used by a target',
    mimeType: 'application/json',
  })
  async resourceGraphUses(params: { name: string }) {
    const { apps, packages, internalNames } = await this.getWorkspace();
    const all = [...apps, ...packages];
    const target = all.find((p) => p.name === params.name);
    const uri = `repo://graph/uses/${params.name}`;
    if (!target) return { contents: [{ uri, mimeType: 'text/plain', text: `Target not found: ${params.name}` }], isError: true };
    const pkg = await this.readJson<any>(path.join(target.path, 'package.json'));
    const uses = Object.keys({ ...(pkg?.dependencies ?? {}), ...(pkg?.peerDependencies ?? {}) }).filter((n) =>
      internalNames.has(n),
    );
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ target: params.name, uses }, null, 2) }] };
  }

  @ResourceTemplate({
    name: 'graph-used-by',
    uriTemplate: 'repo://graph/used-by/{name}',
    description: 'List internal workspace packages/apps that depend on a target',
    mimeType: 'application/json',
  })
  async resourceGraphUsedBy(params: { name: string }) {
    const { apps, packages } = await this.getWorkspace();
    const all = [...apps, ...packages];
    const target = all.find((p) => p.name === params.name);
    const uri = `repo://graph/used-by/${params.name}`;
    if (!target) return { contents: [{ uri, mimeType: 'text/plain', text: `Target not found: ${params.name}` }], isError: true };
    const usedBy: string[] = [];
    for (const p of all) {
      if (p.name === target.name) continue;
      const pj = await this.readJson<any>(path.join(p.path, 'package.json'));
      const deps = { ...(pj?.dependencies ?? {}), ...(pj?.peerDependencies ?? {}) };
      if (deps[target.name]) usedBy.push(p.name);
    }
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ target: params.name, usedBy }, null, 2) }] };
  }

  // ======
  // Prompts
  // ======

  @Prompt({
    name: 'create-app-wizard',
    description: 'Guide to create a new app in apps/ with optional Next.js scaffold',
    parameters: z
      .object({
        appName: z.string().optional().describe('Folder name under apps'),
        template: z.enum(['none', 'nextjs']).optional(),
        flags: z.array(z.string()).optional(),
      }) as any,
  })
  async promptCreateAppWizard(params?: { appName?: string; template?: 'none' | 'nextjs'; flags?: string[] }) {
    const suggested = {
      name: 'create-app',
      arguments: {
        appName: params?.appName ?? 'my-app',
        template: params?.template ?? 'nextjs',
        cliFlags: params?.flags ?? ['--ts', '--eslint'],
      },
    };
    const text = [
      'This prompt helps you create a new app under apps/.',
      'Review and run the suggested tool call below to proceed:',
      '---',
      JSON.stringify(suggested, null, 2),
    ].join('\n');
    return {
      description: 'Create app wizard',
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text }],
        },
      ],
    };
  }

  @Prompt({
    name: 'add-dependency-wizard',
    description: 'Guide to add a dependency to an app or package',
    parameters: z
      .object({
        targetType: z.enum(['app', 'package']).optional(),
        targetName: z.string().optional(),
        depName: z.string().optional(),
        version: z.string().optional(),
        dev: z.boolean().optional(),
      }) as any,
  })
  async promptAddDependencyWizard(
    params?: { targetType?: 'app' | 'package'; targetName?: string; depName?: string; version?: string; dev?: boolean },
  ) {
    const suggested = {
      name: 'add-dependency',
      arguments: {
        targetType: params?.targetType ?? 'package',
        targetName: params?.targetName ?? '@repo/ui',
        depName: params?.depName ?? 'lodash',
        version: params?.version ?? '^4.17.21',
        dev: params?.dev ?? false,
      },
    };
    const text = [
      'Add a dependency to a workspace target.',
      'Edit fields as needed and run the tool:',
      '---',
      JSON.stringify(suggested, null, 2),
    ].join('\n');
    return { messages: [{ role: 'user', content: [{ type: 'text', text }] }] };
  }

  @Prompt({
    name: 'version-bump-plan',
    description: 'Prepare a version bump and follow-up actions',
    parameters: z
      .object({
        targetType: z.enum(['app', 'package']).optional(),
        targetName: z.string().optional(),
        release: z.enum(['major', 'minor', 'patch', 'prerelease']).optional(),
        preid: z.string().optional(),
      }) as any,
  })
  async promptVersionBumpPlan(
    params?: { targetType?: 'app' | 'package'; targetName?: string; release?: 'major' | 'minor' | 'patch' | 'prerelease'; preid?: string },
  ) {
    const suggested = {
      name: 'bump-version',
      arguments: {
        targetType: params?.targetType ?? 'package',
        targetName: params?.targetName ?? '@repo/ui',
        release: params?.release ?? 'patch',
        preid: params?.preid,
      },
    };
    const checklist = [
      '- Run unit tests and type-checks',
      '- Update CHANGELOG.md',
      '- Build the workspace',
      '- Verify reverse dependents for breakages',
    ].join('\n');
    const text = [
      'Version bump plan for selected target:',
      checklist,
      '---',
      'Suggested tool call:',
      JSON.stringify(suggested, null, 2),
    ].join('\n');
    return { messages: [{ role: 'user', content: [{ type: 'text', text }] }] };
  }

  @Prompt({
    name: 'commit-plan',
    description: 'Guide to run lint, type-check, and build in sequence before committing changes',
  })
  async promptCommitPlan() {
    const { repoRoot, apps, packages } = await this.getWorkspace();
    const turbo = (await this.readJson<any>(path.join(repoRoot, 'turbo.json'))) ?? {};
    const pipeline = turbo?.pipeline ?? {};
    const tasksPreferred = ['lint', 'type-check', 'build'];
    const turboTasks = tasksPreferred.filter((t) => pipeline[t]);
    const canUseTurbo = turboTasks.length > 0;

    const steps = [] as string[];
    if (canUseTurbo) {
      steps.push(`1) Run: bunx turbo run ${turboTasks.join(' ')}`);
    } else {
      steps.push('1) Turbo tasks not found; try root scripts if available:');
      steps.push('   - bun --bun run lint');
      steps.push('   - bun --bun run type-check');
      steps.push('   - bun --bun run build');
    }
    steps.push('2) If some targets lack scripts, run per-target scripts:');
    steps.push('   - Example: run-script { targetType: "package", targetName: "@repo/ui", script: "type-check" }');
    steps.push('   - Example: run-script { targetType: "app", targetName: "web", script: "build" }');

    const text = [
      'Commit readiness plan:',
      ...steps,
      '---',
      'Tip: Use resource repo://commit/plan for a machine-readable plan.',
    ].join('\n');
    return { messages: [{ role: 'user', content: [{ type: 'text', text }] }] };
  }

  @Prompt({
    name: 'package-migration-plan',
    description: 'Generate a migration plan for moving/renaming a package or app within the monorepo',
    parameters: z
      .object({
        sourceName: z.string().optional().describe('Current package/app name (package.json name)'),
        targetName: z.string().optional().describe('New name (package.json name) if renaming'),
        newFolder: z.string().optional().describe('New folder name (under apps/ or packages/) if moving'),
        targetType: z.enum(['app', 'package']).optional().describe('Whether the target is an app or a package'),
      }) as any,
  })
  async promptPackageMigrationPlan(
    params?: { sourceName?: string; targetName?: string; newFolder?: string; targetType?: 'app' | 'package' },
  ) {
    const { apps, packages } = await this.getWorkspace();
    const all = [...apps, ...packages];
    const source = params?.sourceName ? all.find((p) => p.name === params.sourceName) : undefined;

    // Compute dependents for impact analysis
    const usedBy: string[] = [];
    if (source) {
      for (const p of all) {
        if (p.name === source.name) continue;
        const pj = await this.readJson<any>(path.join(p.path, 'package.json'));
        const deps = { ...(pj?.dependencies ?? {}), ...(pj?.peerDependencies ?? {}) };
        if (deps[source.name]) usedBy.push(p.name);
      }
    }

    const checklist = [
      '1) Create the new target (if renaming across folders):',
      '   - Use create-package or create-app as appropriate',
      '2) Update package.json fields:',
      '   - name (if renaming)',
      '   - version (optional bump)',
      '   - scripts (preserve or update as needed)',
      '3) Update internal references across the monorepo:',
      '   - Dependencies in other packages/apps (use list-internal-dependencies and add-dependency/remove-dependency)',
      '   - Import paths in source files (search and replace)',
      '   - tsconfig path mappings if used',
      '   - Turbo pipeline filters, Dockerfiles, and CI configs if applicable',
      '4) Move files or git mv the folder to the new location (retain history when possible)',
      '5) Update AGENTS.md, README.md, and docs for the new scope/name',
      '6) Run commit readiness (lint/type-check/build) and update snapshots/tests',
      '7) Remove old target (delete-target) once dependents are updated and tests pass',
    ].join('\n');

    const suggestedActions = [
      {
        name: 'list-internal-dependencies',
        arguments: { targetType: params?.targetType ?? 'package', targetName: params?.sourceName ?? '@repo/old' },
      },
      { name: 'add-dependency', arguments: { targetType: 'package', targetName: '@repo/consumer', depName: params?.targetName ?? '@repo/new', version: '*', dev: false, install: true } },
      { name: 'remove-dependency', arguments: { targetType: 'package', targetName: '@repo/consumer', depName: params?.sourceName ?? '@repo/old', dev: false, install: true } },
    ];

    const text = [
      'Package migration plan (rename/move):',
      checklist,
      '---',
      source ? `Impact: ${source.name} is used by: ${usedBy.length ? usedBy.join(', ') : 'no internal dependents'}` : 'Impact: source not specified',
      '---',
      'Suggested tool calls to assist (edit as needed):',
      JSON.stringify(suggestedActions, null, 2),
    ].join('\n');

    return { messages: [{ role: 'user', content: [{ type: 'text', text }] }] };
  }

  @Tool({
    name: 'add-dependency',
    description:
      'Add a dependency to an app or package. For internal workspace deps, version is set to "*" and install can be toggled.',
    parameters: z
      .object({
        targetType: z.enum(['app', 'package']).describe('Where to add the dependency.'),
        targetName: z.string().describe('package.json name of the target'),
        depName: z.string().describe('Dependency package name'),
        version: z.string().optional().describe('Version (ignored for internal workspace deps unless provided)'),
        dev: z.boolean().default(false).describe('Install as devDependency'),
        install: z.boolean().default(false).describe('Run bun install at repo root when internal'),
      }) as any,
  })
  async addDependency(
    params: {
      targetType: 'app' | 'package';
      targetName: string;
      depName: string;
      version?: string;
      dev?: boolean;
      install?: boolean;
    },
    context: Context,
  ) {
    const { internalNames, repoRoot } = await this.getWorkspace();
    const target = await this.findTarget(params.targetType, params.targetName);
    if (!target) return { error: `Target not found: ${params.targetType} ${params.targetName}` };
    const { info, pkg, pkgPath } = target;
    const dev = !!params.dev;
    const internal = internalNames.has(params.depName);

    if (internal) {
      const field = dev ? 'devDependencies' : 'dependencies';
      pkg[field] = pkg[field] ?? {};
      pkg[field][params.depName] = params.version ?? '*';
      await this.writeJson(pkgPath, pkg);
      await context.reportProgress({ progress: 60, total: 100, label: 'package.json updated' });
      if (params.install) {
        await this.runCommand('bun', ['install'], repoRoot, context, 'Installing workspace links');
      }
      await context.reportProgress({ progress: 100, total: 100, label: 'Done' });
      return { updated: true, internal: true, target: info.path };
    }

    const args = ['add'];
    if (dev) args.push('-D');
    args.push(params.version ? `${params.depName}@${params.version}` : params.depName);
    await this.runCommand('bun', args, info.path, context, 'Adding dependency');
    await context.reportProgress({ progress: 100, total: 100 });
    return { updated: true, internal: false, target: info.path };
  }

  @Tool({
    name: 'remove-dependency',
    description: 'Remove a dependency from an app or package (dev or prod).',
    parameters: z
      .object({
        targetType: z.enum(['app', 'package']),
        targetName: z.string(),
        depName: z.string(),
        dev: z.boolean().default(false),
        install: z.boolean().default(false).describe('Run bun install at repo root if internal dep'),
      }) as any,
  })
  async removeDependency(
    params: { targetType: 'app' | 'package'; targetName: string; depName: string; dev?: boolean; install?: boolean },
    context: Context,
  ) {
    const { internalNames, repoRoot } = await this.getWorkspace();
    const target = await this.findTarget(params.targetType, params.targetName);
    if (!target) return { error: `Target not found: ${params.targetType} ${params.targetName}` };
    const { info, pkg, pkgPath } = target;
    const dev = !!params.dev;
    const internal = internalNames.has(params.depName);

    if (internal) {
      const field = dev ? 'devDependencies' : 'dependencies';
      if (pkg[field]?.[params.depName]) {
        delete pkg[field][params.depName];
        await this.writeJson(pkgPath, pkg);
        if (params.install) await this.runCommand('bun', ['install'], repoRoot, context, 'Updating lockfile');
        await context.reportProgress({ progress: 100, total: 100 });
        return { removed: true, internal: true };
      }
      return { removed: false, message: 'Dependency not present' };
    }

    await this.runCommand('bun', ['remove', params.depName], info.path, context, 'Removing dependency');
    await context.reportProgress({ progress: 100, total: 100 });
    return { removed: true, internal: false };
  }

  @Tool({
    name: 'run-script',
    description: 'Run a package.json script in a given app or package.',
    parameters: z
      .object({
        targetType: z.enum(['app', 'package']),
        targetName: z.string(),
        script: z.string(),
        args: z.array(z.string()).optional(),
        timeoutMs: z.number().int().positive().optional().describe('Optional timeout to kill the process'),
      }) as any,
  })
  async runScript(
    params: { targetType: 'app' | 'package'; targetName: string; script: string; args?: string[]; timeoutMs?: number },
    context: Context,
  ) {
    const target = await this.findTarget(params.targetType, params.targetName);
    if (!target) return { error: `Target not found: ${params.targetType} ${params.targetName}` };
    const { info } = target;
    const child = spawn('bun', ['--bun', 'run', params.script, ...(params.args ?? [])], {
      cwd: info.path,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });
    let stderr = '';
    child.stdout.on('data', async () => {
      await context.reportProgress({ progress: 50, total: 100, label: `Running ${params.script}` });
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    const timeout = params.timeoutMs;
    if (timeout && timeout > 0) {
      // Basic timeout handling
      void (async () => {
        await sleep(timeout);
        try {
          child.kill('SIGKILL');
        } catch {}
      })();
    }
    return new Promise((resolve) => {
      child.on('close', async (code) => {
        await context.reportProgress({ progress: 100, total: 100 });
        resolve({ exitCode: code, stderr });
      });
    });
  }

  @Tool({
    name: 'list-internal-dependencies',
    description: 'For a given target, list internal workspace deps it uses and which internal packages depend on it.',
    parameters: z
      .object({ targetType: z.enum(['app', 'package']), targetName: z.string() }) as any,
  })
  async listInternalDependencies(params: { targetType: 'app' | 'package'; targetName: string }) {
    const { apps, packages, internalNames } = await this.getWorkspace();
    const all = [...apps, ...packages];
    const target = all.find((p) => p.name === params.targetName);
    if (!target) return { error: `Target not found: ${params.targetName}` };
    const pkg = await this.readJson<any>(path.join(target.path, 'package.json'));
    if (!pkg) return { error: 'package.json missing' };
    const uses = Object.keys({ ...(pkg.dependencies ?? {}), ...(pkg.peerDependencies ?? {}) }).filter((n) =>
      internalNames.has(n),
    );
    const usedBy: string[] = [];
    for (const p of all) {
      if (p.name === target.name) continue;
      const pj = await this.readJson<any>(path.join(p.path, 'package.json'));
      if (!pj) continue;
      const deps = { ...(pj.dependencies ?? {}), ...(pj.peerDependencies ?? {}) };
      if (deps[target.name]) usedBy.push(p.name);
    }
    return { target: target.name, uses, usedBy };
  }

  @Tool({
    name: 'delete-target',
    description: 'Delete an app or package directory. Dangerous! Requires confirm=true.',
    parameters: z
      .object({ targetType: z.enum(['app', 'package']), targetName: z.string(), confirm: z.boolean().default(false) }) as any,
  })
  async deleteTarget(params: { targetType: 'app' | 'package'; targetName: string; confirm: boolean }, context: Context) {
    if (!params.confirm) return { error: 'Operation not confirmed. Set confirm=true to proceed.' };
    const target = await this.findTarget(params.targetType, params.targetName);
    if (!target) return { error: `Target not found: ${params.targetType} ${params.targetName}` };
    await fs.rm(target.info.path, { recursive: true, force: true });
    await context.reportProgress({ progress: 100, total: 100, label: 'Deleted' });
    return { deleted: true, path: target.info.path };
  }

  @Tool({
    name: 'bump-version',
    description: 'Bump the version field of an app or package: major, minor, patch, or prerelease.',
    parameters: z
      .object({
        targetType: z.enum(['app', 'package']),
        targetName: z.string(),
        release: z.enum(['major', 'minor', 'patch', 'prerelease']),
        preid: z.string().optional(),
      }) as any,
  })
  async bumpVersion(
    params: { targetType: 'app' | 'package'; targetName: string; release: 'patch' | 'minor' | 'major' | 'prerelease'; preid?: string },
    context: Context,
  ) {
    const target = await this.findTarget(params.targetType, params.targetName);
    if (!target) return { error: `Target not found: ${params.targetType} ${params.targetName}` };
    const { pkg, pkgPath } = target;
    const current = pkg.version ?? '0.1.0';
    const next = this.bumpVersionStr(current, params.release, params.preid);
    pkg.version = next;
    await this.writeJson(pkgPath, pkg);
    await context.reportProgress({ progress: 100, total: 100 });
    return { previous: current, next };
  }

  @Tool({
    name: 'add-script',
    description: 'Add or overwrite a package.json script for a target.',
    parameters: z
      .object({
        targetType: z.enum(['app', 'package']),
        targetName: z.string(),
        scriptName: z.string(),
        scriptCmd: z.string(),
        overwrite: z.boolean().default(false),
      }) as any,
  })
  async addScript(
    params: { targetType: 'app' | 'package'; targetName: string; scriptName: string; scriptCmd: string; overwrite?: boolean },
  ) {
    const target = await this.findTarget(params.targetType, params.targetName);
    if (!target) return { error: `Target not found: ${params.targetType} ${params.targetName}` };
    const { pkg, pkgPath } = target;
    pkg.scripts = pkg.scripts ?? {};
    if (pkg.scripts[params.scriptName] && !params.overwrite) {
      return { updated: false, message: 'Script exists. Use overwrite=true to replace.' };
    }
    pkg.scripts[params.scriptName] = params.scriptCmd;
    await this.writeJson(pkgPath, pkg);
    return { updated: true };
  }

  // =====================
  // Repo common operations
  // =====================

  @Tool({
    name: 'api-db',
    description: 'Run apps/api database tasks: generate | push | migrate | seed | reset | studio',
    parameters: z
      .object({ action: z.enum(['generate', 'push', 'migrate', 'seed', 'reset', 'studio']), extraArgs: z.array(z.string()).optional() }) as any,
  })
  async apiDb(params: { action: 'generate' | 'push' | 'migrate' | 'seed' | 'reset' | 'studio'; extraArgs?: string[] }, context: Context) {
    const target = await this.findTarget('app', 'api');
    if (!target) return { error: 'apps/api not found' };
    const scriptMap: Record<typeof params.action, string> = {
      generate: 'db:generate',
      push: 'db:push',
      migrate: 'db:migrate',
      seed: 'db:seed',
      reset: 'db:reset',
      studio: 'db:studio',
    } as const;
    const script = scriptMap[params.action];
    const args = ['--bun', 'run', script, ...(params.extraArgs ?? [])];
    await this.runCommand('bun', args, target.info.path, context, `api ${script}`);
    await context.reportProgress({ progress: 100, total: 100 });
    return { ok: true };
  }

  @Tool({
    name: 'auth-generate',
    description: 'Run auth:generate in apps/api to regenerate auth schema and drizzle types',
  })
  async authGenerate(_: unknown, context: Context) {
    const target = await this.findTarget('app', 'api');
    if (!target) return { error: 'apps/api not found' };
    await this.runCommand('bun', ['--bun', 'run', 'auth:generate'], target.info.path, context, 'auth:generate');
    await context.reportProgress({ progress: 100, total: 100 });
    return { ok: true };
  }

  @Tool({
    name: 'ui-add',
    description: 'Add shadcn/ui components to @repo/ui via its ui:add script',
    parameters: z
      .object({ components: z.array(z.string()).min(1).describe('Component names to add'), flags: z.array(z.string()).optional() }) as any,
  })
  async uiAdd(params: { components: string[]; flags?: string[] }, context: Context) {
    const target = await this.findTarget('package', '@repo/ui');
    if (!target) return { error: 'packages/ui not found (@repo/ui)' };
    const args = ['--bun', 'run', 'ui:add', ...(params.components ?? []), ...(params.flags ?? [])];
    await this.runCommand('bun', args, target.info.path, context, 'ui:add');
    await context.reportProgress({ progress: 100, total: 100 });
    return { ok: true };
  }

  @Tool({
    name: 'docker-up',
    description: 'Start docker-compose stacks (dev or prod) without stopping existing containers. Supports api | web | all.',
    parameters: z
      .object({
        mode: z.enum(['dev', 'prod']).default('dev'),
        target: z.enum(['api', 'web', 'all']).default('all'),
        build: z.boolean().default(false),
        detach: z.boolean().default(true),
        extraArgs: z.array(z.string()).optional(),
      }) as any,
  })
  async dockerUp(
    params: { mode?: 'dev' | 'prod'; target?: 'api' | 'web' | 'all'; build?: boolean; detach?: boolean; extraArgs?: string[] },
    context: Context,
  ) {
    const { repoRoot } = await this.getWorkspace();
    const mode = params.mode ?? 'dev';
    const target = params.target ?? 'all';
    const fileMap: Record<'dev' | 'prod', Record<'api' | 'web' | 'all', string>> = {
      dev: { api: 'docker-compose.api.yml', web: 'docker-compose.web.yml', all: 'docker-compose.yml' },
      prod: { api: 'docker-compose.api.prod.yml', web: 'docker-compose.web.prod.yml', all: 'docker-compose.prod.yml' },
    };
    const composeFile = fileMap[mode][target];
    const args = ['compose', '-f', path.join(repoRoot, composeFile), 'up'];
    if (params.build) args.push('--build');
    if (params.detach !== false) args.push('-d');
    if (params.extraArgs) args.push(...params.extraArgs);
    await this.runCommand('docker', args, repoRoot, context, `docker up ${mode}:${target}`);
    await context.reportProgress({ progress: 100, total: 100 });
    return { ok: true, file: composeFile };
  }

  @Tool({
    name: 'docker-build',
    description: 'Build docker-compose images (dev or prod). Supports api | web | all.',
    parameters: z
      .object({ mode: z.enum(['dev', 'prod']).default('dev'), target: z.enum(['api', 'web', 'all']).default('all'), noCache: z.boolean().default(false), extraArgs: z.array(z.string()).optional() }) as any,
  })
  async dockerBuild(params: { mode?: 'dev' | 'prod'; target?: 'api' | 'web' | 'all'; noCache?: boolean; extraArgs?: string[] }, context: Context) {
    const { repoRoot } = await this.getWorkspace();
    const mode = params.mode ?? 'dev';
    const target = params.target ?? 'all';
    const fileMap: Record<'dev' | 'prod', Record<'api' | 'web' | 'all', string>> = {
      dev: { api: 'docker-compose.api.yml', web: 'docker-compose.web.yml', all: 'docker-compose.yml' },
      prod: { api: 'docker-compose.api.prod.yml', web: 'docker-compose.web.prod.yml', all: 'docker-compose.prod.yml' },
    };
    const composeFile = fileMap[mode][target];
    const args = ['compose', '-f', path.join(repoRoot, composeFile), 'build'];
    if (params.noCache) args.push('--no-cache');
    if (params.extraArgs) args.push(...params.extraArgs);
    await this.runCommand('docker', args, repoRoot, context, `docker build ${mode}:${target}`);
    await context.reportProgress({ progress: 100, total: 100 });
    return { ok: true, file: composeFile };
  }
}
