import type { Plugin } from '../types';

export function resolveDependencies(
  selectedPluginIds: string[],
  allPlugins: Plugin[]
): string[] {
  const resolved = new Set<string>();
  const visited = new Set<string>();

  function resolve(pluginId: string) {
    if (visited.has(pluginId)) return;
    visited.add(pluginId);

    const plugin = allPlugins.find((p) => p.id === pluginId);
    if (!plugin) return;

    // Add dependencies first
    plugin.dependencies.forEach((depId) => {
      resolve(depId);
    });

    // Add the plugin itself
    resolved.add(pluginId);
  }

  // Resolve all selected plugins
  selectedPluginIds.forEach((id) => resolve(id));

  return Array.from(resolved);
}

export function getOptionalDependencies(
  selectedPluginIds: string[],
  allPlugins: Plugin[]
): string[] {
  const optional = new Set<string>();

  selectedPluginIds.forEach((id) => {
    const plugin = allPlugins.find((p) => p.id === id);
    if (plugin && plugin.optionalDependencies) {
      plugin.optionalDependencies.forEach((optId) => {
        if (!selectedPluginIds.includes(optId)) {
          optional.add(optId);
        }
      });
    }
  });

  return Array.from(optional);
}

export function detectConflicts(
  selectedPluginIds: string[],
  allPlugins: Plugin[]
): Array<{ plugin1: string; plugin2: string }> {
  const conflicts: Array<{ plugin1: string; plugin2: string }> = [];

  for (let i = 0; i < selectedPluginIds.length; i++) {
    const plugin1 = allPlugins.find((p) => p.id === selectedPluginIds[i]);
    if (!plugin1 || !plugin1.conflicts) continue;

    for (let j = i + 1; j < selectedPluginIds.length; j++) {
      const plugin2Id = selectedPluginIds[j];
      if (plugin1.conflicts.includes(plugin2Id)) {
        conflicts.push({ plugin1: plugin1.id, plugin2: plugin2Id });
      }
    }
  }

  return conflicts;
}
