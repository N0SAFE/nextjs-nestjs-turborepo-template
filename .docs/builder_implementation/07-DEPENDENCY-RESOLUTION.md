# Dependency Resolution

📍 [Documentation Hub](../README.md) > [Builder Implementation](./README.md) > Dependency Resolution

## Overview

The dependency resolution system automatically determines which plugins need to be installed based on user selections and plugin dependencies. This document explains the algorithm, conflict detection, and resolution strategies.

## Dependency Types

### 1. Required Dependencies

Plugins that MUST be installed:

```typescript
{
  id: 'better-auth',
  dependencies: ['base', 'database', 'typescript']
}
```

If user selects `better-auth`, the builder automatically installs `base`, `database`, and `typescript`.

### 2. Optional Dependencies

Plugins that enhance functionality but aren't required:

```typescript
{
  id: 'better-auth',
  optionalDependencies: ['redis', 'email']
}
```

Builder suggests but doesn't force installation of `redis` and `email`.

### 3. Peer Dependencies

Plugins that must exist in specific versions:

```typescript
{
  id: 'orpc',
  peerDependencies: {
    'typescript': '^1.0.0',
    '@orpc/server': '^1.12.0'
  }
}
```

Builder verifies version compatibility.

### 4. Conflicts

Plugins that cannot coexist:

```typescript
{
  id: 'orpc',
  conflicts: ['rest-api', 'graphql']
}
```

Builder prevents installation of conflicting plugins.

## Dependency Graph

### Graph Structure

```typescript
interface DependencyNode {
  plugin: Plugin;
  dependencies: DependencyNode[];
  dependents: DependencyNode[];  // Reverse dependencies
  depth: number;  // Distance from root
  status: 'pending' | 'resolved' | 'installed';
}

interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  roots: DependencyNode[];  // Plugins with no dependencies
  
  // Methods
  addNode(plugin: Plugin): void;
  addEdge(from: string, to: string): void;
  resolve(): Plugin[];  // Topological sort
  detectCycles(): string[][];
  findConflicts(): Conflict[];
}
```

### Example Graph

```
User selects: [better-auth, orpc]

Dependency Graph:
    base
   /  |  \
  /   |   \
 TS  db  turbo
  \  /     
   \/      
 better-auth
     |
   redis (optional)
     |
 job-queue

 orpc
  |
  TS
```

## Resolution Algorithm

### Step 1: Build Dependency Graph

```typescript
class DependencyResolver {
  async buildGraph(selected: string[]): Promise<DependencyGraph> {
    const graph = new DependencyGraph();
    const visited = new Set<string>();
    
    // Add selected plugins
    for (const id of selected) {
      await this.addPluginToGraph(id, graph, visited);
    }
    
    return graph;
  }
  
  private async addPluginToGraph(
    id: string,
    graph: DependencyGraph,
    visited: Set<string>
  ): Promise<void> {
    // Avoid infinite loops
    if (visited.has(id)) return;
    visited.add(id);
    
    // Load plugin
    const plugin = await this.registry.get(id);
    if (!plugin) {
      throw new Error(`Plugin not found: ${id}`);
    }
    
    // Add to graph
    graph.addNode(plugin);
    
    // Recursively add dependencies
    for (const depId of plugin.dependencies) {
      await this.addPluginToGraph(depId, graph, visited);
      graph.addEdge(plugin.id, depId);
    }
  }
}
```

### Step 2: Detect Cycles

```typescript
detectCycles(graph: DependencyGraph): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function dfs(nodeId: string, path: string[]): void {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);
    
    const node = graph.nodes.get(nodeId);
    for (const dep of node.dependencies) {
      if (!visited.has(dep.plugin.id)) {
        dfs(dep.plugin.id, [...path]);
      } else if (recursionStack.has(dep.plugin.id)) {
        // Cycle detected
        const cycleStart = path.indexOf(dep.plugin.id);
        cycles.push(path.slice(cycleStart).concat(dep.plugin.id));
      }
    }
    
    recursionStack.delete(nodeId);
  }
  
  for (const nodeId of graph.nodes.keys()) {
    if (!visited.has(nodeId)) {
      dfs(nodeId, []);
    }
  }
  
  return cycles;
}
```

### Step 3: Detect Conflicts

```typescript
findConflicts(graph: DependencyGraph): Conflict[] {
  const conflicts: Conflict[] = [];
  const plugins = Array.from(graph.nodes.values());
  
  for (let i = 0; i < plugins.length; i++) {
    const plugin1 = plugins[i];
    
    for (let j = i + 1; j < plugins.length; j++) {
      const plugin2 = plugins[j];
      
      // Check if plugins conflict
      if (plugin1.plugin.conflicts?.includes(plugin2.plugin.id)) {
        conflicts.push({
          plugin1: plugin1.plugin.id,
          plugin2: plugin2.plugin.id,
          reason: `${plugin1.plugin.name} conflicts with ${plugin2.plugin.name}`
        });
      }
      
      // Check version compatibility
      if (plugin1.plugin.peerDependencies?.[plugin2.plugin.id]) {
        const requiredVersion = plugin1.plugin.peerDependencies[plugin2.plugin.id];
        const actualVersion = plugin2.plugin.version;
        
        if (!satisfies(actualVersion, requiredVersion)) {
          conflicts.push({
            plugin1: plugin1.plugin.id,
            plugin2: plugin2.plugin.id,
            reason: `${plugin1.plugin.name} requires ${plugin2.plugin.name} ${requiredVersion}, but ${actualVersion} is installed`
          });
        }
      }
    }
  }
  
  return conflicts;
}
```

### Step 4: Topological Sort

```typescript
topologicalSort(graph: DependencyGraph): Plugin[] {
  const sorted: Plugin[] = [];
  const visited = new Set<string>();
  const tempMarked = new Set<string>();
  
  function visit(nodeId: string): void {
    if (tempMarked.has(nodeId)) {
      throw new Error('Cycle detected in dependency graph');
    }
    
    if (!visited.has(nodeId)) {
      tempMarked.add(nodeId);
      
      const node = graph.nodes.get(nodeId);
      
      // Visit dependencies first
      for (const dep of node.dependencies) {
        visit(dep.plugin.id);
      }
      
      tempMarked.delete(nodeId);
      visited.add(nodeId);
      sorted.push(node.plugin);
    }
  }
  
  // Visit all nodes
  for (const nodeId of graph.nodes.keys()) {
    if (!visited.has(nodeId)) {
      visit(nodeId);
    }
  }
  
  return sorted;
}
```

### Step 5: Handle Optional Dependencies

```typescript
async handleOptionalDependencies(
  graph: DependencyGraph
): Promise<string[]> {
  const optional: string[] = [];
  
  // Collect all optional dependencies
  for (const node of graph.nodes.values()) {
    for (const optDep of node.plugin.optionalDependencies || []) {
      if (!graph.nodes.has(optDep)) {
        optional.push(optDep);
      }
    }
  }
  
  if (optional.length === 0) return [];
  
  // Ask user
  const selected = await prompts({
    type: 'multiselect',
    name: 'plugins',
    message: 'Optional dependencies detected. Select to install:',
    choices: optional.map(id => {
      const plugin = this.registry.get(id);
      return {
        title: `${plugin.name} - ${plugin.description}`,
        value: id,
        selected: false
      };
    })
  });
  
  return selected.plugins;
}
```

## Resolution Strategies

### Strategy 1: Minimal Installation

Install only required dependencies:

```typescript
async resolveMinimal(selected: string[]): Promise<Plugin[]> {
  const graph = await this.buildGraph(selected);
  
  // Detect issues
  const cycles = this.detectCycles(graph);
  if (cycles.length > 0) {
    throw new Error(`Circular dependencies: ${cycles}`);
  }
  
  const conflicts = this.findConflicts(graph);
  if (conflicts.length > 0) {
    throw new Error(`Conflicts: ${conflicts}`);
  }
  
  // Return sorted plugins
  return this.topologicalSort(graph);
}
```

### Strategy 2: Suggested Installation

Include recommended optional dependencies:

```typescript
async resolveSuggested(selected: string[]): Promise<Plugin[]> {
  let plugins = await this.resolveMinimal(selected);
  
  // Add suggested optional dependencies
  const suggested = await this.getSuggestedOptional(plugins);
  
  if (suggested.length > 0) {
    plugins = await this.resolveMinimal([
      ...selected,
      ...suggested
    ]);
  }
  
  return plugins;
}

private async getSuggestedOptional(plugins: Plugin[]): Promise<string[]> {
  const suggested: string[] = [];
  
  for (const plugin of plugins) {
    // Add highly recommended optional deps
    for (const optDep of plugin.optionalDependencies || []) {
      const depPlugin = await this.registry.get(optDep);
      if (depPlugin.recommendation === 'high') {
        suggested.push(optDep);
      }
    }
  }
  
  return suggested;
}
```

### Strategy 3: Full Installation

Install all optional dependencies:

```typescript
async resolveFull(selected: string[]): Promise<Plugin[]> {
  let currentPlugins = selected;
  let prevSize = 0;
  
  // Iteratively add optional dependencies
  while (currentPlugins.length !== prevSize) {
    prevSize = currentPlugins.length;
    
    const graph = await this.buildGraph(currentPlugins);
    
    // Add all optional dependencies
    for (const node of graph.nodes.values()) {
      currentPlugins.push(...(node.plugin.optionalDependencies || []));
    }
    
    currentPlugins = [...new Set(currentPlugins)];  // Remove duplicates
  }
  
  return await this.resolveMinimal(currentPlugins);
}
```

## Conflict Resolution

### Manual Resolution

Present conflicts to user:

```typescript
async resolveConflicts(conflicts: Conflict[]): Promise<Resolution[]> {
  const resolutions: Resolution[] = [];
  
  for (const conflict of conflicts) {
    const resolution = await prompts({
      type: 'select',
      name: 'action',
      message: `Conflict: ${conflict.reason}\nHow to resolve?`,
      choices: [
        {
          title: `Keep ${conflict.plugin1}`,
          value: { remove: conflict.plugin2 }
        },
        {
          title: `Keep ${conflict.plugin2}`,
          value: { remove: conflict.plugin1 }
        },
        {
          title: 'Keep both (may cause issues)',
          value: { keepBoth: true }
        },
        {
          title: 'Cancel installation',
          value: { cancel: true }
        }
      ]
    });
    
    if (resolution.action.cancel) {
      throw new Error('Installation cancelled by user');
    }
    
    resolutions.push(resolution.action);
  }
  
  return resolutions;
}
```

### Automatic Resolution

Use conflict resolution rules:

```typescript
const resolutionRules: ConflictRule[] = [
  // Always prefer newer versions
  {
    type: 'version-conflict',
    resolver: (conflict) => {
      return semver.gt(conflict.plugin1.version, conflict.plugin2.version)
        ? { keep: conflict.plugin1.id }
        : { keep: conflict.plugin2.id };
    }
  },
  
  // Prefer core plugins over third-party
  {
    type: 'category-conflict',
    resolver: (conflict) => {
      if (conflict.plugin1.category === 'core') {
        return { keep: conflict.plugin1.id };
      }
      if (conflict.plugin2.category === 'core') {
        return { keep: conflict.plugin2.id };
      }
      return null;  // Can't auto-resolve
    }
  }
];
```

## Version Resolution

### Semver Resolution

```typescript
async resolveVersions(plugins: Plugin[]): Promise<Plugin[]> {
  const resolved: Plugin[] = [];
  const versions = new Map<string, string[]>();
  
  // Collect all version requirements
  for (const plugin of plugins) {
    for (const [depId, versionRange] of Object.entries(plugin.peerDependencies || {})) {
      if (!versions.has(depId)) {
        versions.set(depId, []);
      }
      versions.get(depId).push(versionRange);
    }
  }
  
  // Find compatible versions
  for (const plugin of plugins) {
    const ranges = versions.get(plugin.id) || [];
    
    if (ranges.length === 0) {
      // No constraints
      resolved.push(plugin);
      continue;
    }
    
    // Find version that satisfies all ranges
    const compatible = this.findCompatibleVersion(plugin, ranges);
    
    if (!compatible) {
      throw new Error(
        `Cannot find version of ${plugin.id} that satisfies: ${ranges.join(', ')}`
      );
    }
    
    resolved.push(compatible);
  }
  
  return resolved;
}

private findCompatibleVersion(
  plugin: Plugin,
  ranges: string[]
): Plugin | null {
  const versions = this.registry.getVersions(plugin.id);
  
  for (const version of versions.sort(semver.rcompare)) {
    if (ranges.every(range => semver.satisfies(version, range))) {
      return this.registry.get(plugin.id, version);
    }
  }
  
  return null;
}
```

## Dependency Visualization

### ASCII Tree

```typescript
function visualizeDependencyTree(graph: DependencyGraph): string {
  const lines: string[] = [];
  const visited = new Set<string>();
  
  function printNode(
    node: DependencyNode,
    prefix: string = '',
    isLast: boolean = true
  ): void {
    const branch = isLast ? '└── ' : '├── ';
    const pluginName = node.plugin.name;
    const version = node.plugin.version;
    const status = visited.has(node.plugin.id) ? '(see above)' : '';
    
    lines.push(`${prefix}${branch}${pluginName}@${version} ${status}`);
    
    if (!visited.has(node.plugin.id)) {
      visited.add(node.plugin.id);
      
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      const deps = node.dependencies;
      
      deps.forEach((dep, index) => {
        printNode(dep, newPrefix, index === deps.length - 1);
      });
    }
  }
  
  graph.roots.forEach((root, index) => {
    printNode(root, '', index === graph.roots.length - 1);
  });
  
  return lines.join('\n');
}
```

Output:
```
└── better-auth@1.0.0
    ├── base@1.0.0
    │   ├── typescript@1.0.0
    │   └── turborepo@1.0.0
    ├── database@1.0.0
    │   └── base@1.0.0 (see above)
    └── redis@1.0.0 (optional)
        └── base@1.0.0 (see above)
```

### Graphical Visualization

Generate DOT format for Graphviz:

```typescript
function toDOT(graph: DependencyGraph): string {
  const lines = ['digraph Dependencies {'];
  lines.push('  rankdir=LR;');
  lines.push('  node [shape=box];');
  
  // Add nodes
  for (const node of graph.nodes.values()) {
    const color = node.plugin.category === 'core' ? 'lightblue' : 'lightgray';
    lines.push(`  "${node.plugin.id}" [label="${node.plugin.name}\\n${node.plugin.version}", fillcolor="${color}", style=filled];`);
  }
  
  // Add edges
  for (const node of graph.nodes.values()) {
    for (const dep of node.dependencies) {
      const style = node.plugin.optionalDependencies?.includes(dep.plugin.id)
        ? 'dashed'
        : 'solid';
      lines.push(`  "${node.plugin.id}" -> "${dep.plugin.id}" [style=${style}];`);
    }
  }
  
  lines.push('}');
  return lines.join('\n');
}
```

## Testing

### Unit Tests

```typescript
describe('Dependency Resolver', () => {
  let resolver: DependencyResolver;
  
  beforeEach(() => {
    resolver = new DependencyResolver(mockRegistry);
  });
  
  it('should resolve linear dependencies', async () => {
    const result = await resolver.resolve(['better-auth']);
    
    expect(result.map(p => p.id)).toEqual([
      'base',
      'typescript',
      'database',
      'better-auth'
    ]);
  });
  
  it('should detect circular dependencies', async () => {
    await expect(
      resolver.resolve(['circular-a'])
    ).rejects.toThrow('Circular dependencies');
  });
  
  it('should detect conflicts', async () => {
    await expect(
      resolver.resolve(['orpc', 'graphql'])
    ).rejects.toThrow('Conflicts');
  });
  
  it('should handle optional dependencies', async () => {
    const result = await resolver.resolve(['better-auth'], {
      includeOptional: ['redis']
    });
    
    expect(result.map(p => p.id)).toContain('redis');
  });
});
```

## Best Practices

### 1. Keep Dependencies Minimal
Only declare necessary dependencies.

### 2. Use Optional Dependencies Wisely
For features that enhance but aren't required.

### 3. Document Dependencies
Explain why each dependency is needed.

### 4. Version Constraints
Use semver ranges appropriately:
- `^1.0.0` - Compatible with 1.x.x
- `~1.0.0` - Compatible with 1.0.x
- `>=1.0.0 <2.0.0` - Explicit range

### 5. Test Dependency Resolution
Test various dependency combinations.

## Next Steps

- Review [Code Generation](./08-CODE-GENERATION.md) for template generation
- Study [Testing Strategy](./09-TESTING-STRATEGY.md) for testing
- Read [Extension Guide](./11-EXTENSION-GUIDE.md) for creating plugins

---

*Proper dependency resolution ensures consistent, conflict-free installations.*
