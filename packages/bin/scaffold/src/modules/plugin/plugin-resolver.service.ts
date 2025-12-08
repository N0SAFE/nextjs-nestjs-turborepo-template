/**
 * Plugin Resolver Service
 *
 * Handles plugin dependency resolution, conflict detection, and ordering.
 */
import { Injectable } from "@nestjs/common";
import { PluginRegistryService } from "./plugin-registry.service";
import type {
  Plugin,
  PluginResolutionResult,
  PluginConflict,
  MissingDependency,
} from "../../types/plugin.types";
import {
  PluginDependencyError,
  PluginConflictError,
} from "../../types/errors.types";

@Injectable()
export class PluginResolverService {
  constructor(private readonly registry: PluginRegistryService) {}

  /**
   * Resolve plugins with dependency ordering
   */
  resolve(pluginIds: string[]): PluginResolutionResult {
    // Validate all plugins exist
    const plugins: Plugin[] = [];
    const unresolved: string[] = [];

    for (const id of pluginIds) {
      if (this.registry.has(id)) {
        plugins.push(this.registry.get(id));
      } else {
        unresolved.push(id);
      }
    }

    // Check for missing dependencies
    const missingDependencies = this.findMissingDependencies(plugins, pluginIds);

    // Check for conflicts
    const conflicts = this.findConflicts(plugins);

    // Topological sort for dependency order
    const ordered = this.topologicalSort(plugins);

    return {
      resolved: ordered.map((p) => p.id),
      autoEnabled: [],
      unresolved,
      conflicts,
      missingDependencies,
    };
  }

  /**
   * Check if resolution was successful
   */
  isValid(result: PluginResolutionResult): boolean {
    return (
      result.unresolved.length === 0 &&
      result.missingDependencies.length === 0 &&
      result.conflicts.length === 0
    );
  }

  /**
   * Resolve and throw on errors
   */
  resolveOrThrow(pluginIds: string[]): string[] {
    const result = this.resolve(pluginIds);

    if (!this.isValid(result)) {
      if (result.missingDependencies.length > 0) {
        const firstMissing = result.missingDependencies[0]!;
        throw new PluginDependencyError(
          firstMissing.pluginId,
          [firstMissing.dependencyId],
        );
      }

      if (result.conflicts.length > 0) {
        const firstConflict = result.conflicts[0]!;
        throw new PluginConflictError(
          firstConflict.pluginId,
          [firstConflict.conflictsWith],
        );
      }
    }

    return result.resolved;
  }

  /**
   * Auto-resolve dependencies (add missing deps automatically)
   */
  autoResolve(pluginIds: string[]): PluginResolutionResult {
    const allPlugins = new Set(pluginIds);
    const autoEnabled: string[] = [];
    const toProcess = [...pluginIds];
    const processed = new Set<string>();

    // Recursively add dependencies
    while (toProcess.length > 0) {
      const id = toProcess.pop()!;
      if (processed.has(id)) continue;
      processed.add(id);

      if (!this.registry.has(id)) continue;

      const plugin = this.registry.get(id);
      const deps = plugin.dependencies ?? [];
      for (const dep of deps) {
        if (!allPlugins.has(dep)) {
          allPlugins.add(dep);
          autoEnabled.push(dep);
          toProcess.push(dep);
        }
      }
    }

    const baseResult = this.resolve(Array.from(allPlugins));
    return {
      ...baseResult,
      autoEnabled,
    };
  }

  /**
   * Check if a plugin can be added to existing selection
   */
  canAdd(existingIds: string[], newId: string): { canAdd: boolean; reason?: string } {
    if (!this.registry.has(newId)) {
      return { canAdd: false, reason: `Plugin '${newId}' not found` };
    }

    const newPlugin = this.registry.get(newId);

    // Check conflicts with existing
    for (const existingId of existingIds) {
      const existing = this.registry.get(existingId);
      const existingConflicts = existing.conflicts ?? [];
      const newConflicts = newPlugin.conflicts ?? [];

      if (existingConflicts.includes(newId)) {
        return {
          canAdd: false,
          reason: `Plugin '${newId}' conflicts with '${existingId}'`,
        };
      }

      if (newConflicts.includes(existingId)) {
        return {
          canAdd: false,
          reason: `Plugin '${newId}' conflicts with '${existingId}'`,
        };
      }
    }

    return { canAdd: true };
  }

  /**
   * Check if a plugin can be removed from selection
   */
  canRemove(
    existingIds: string[],
    removeId: string,
  ): { canRemove: boolean; dependents?: string[] } {
    const dependents: string[] = [];

    for (const id of existingIds) {
      if (id === removeId) continue;

      const plugin = this.registry.get(id);
      const deps = plugin.dependencies ?? [];
      if (deps.includes(removeId)) {
        dependents.push(id);
      }
    }

    if (dependents.length > 0) {
      return { canRemove: false, dependents };
    }

    return { canRemove: true };
  }

  /**
   * Find missing dependencies
   */
  private findMissingDependencies(
    plugins: Plugin[],
    selectedIds: string[],
  ): MissingDependency[] {
    const selectedSet = new Set(selectedIds);
    const missing: MissingDependency[] = [];

    for (const plugin of plugins) {
      const deps = plugin.dependencies ?? [];
      for (const dep of deps) {
        if (!selectedSet.has(dep)) {
          missing.push({
            pluginId: plugin.id,
            dependencyId: dep,
            optional: false,
          });
        }
      }
    }

    return missing;
  }

  /**
   * Find conflicts between plugins
   */
  private findConflicts(plugins: Plugin[]): PluginConflict[] {
    const conflicts: PluginConflict[] = [];
    const pluginIds = new Set(plugins.map((p) => p.id));

    for (const plugin of plugins) {
      const pluginConflicts = plugin.conflicts ?? [];
      for (const conflictId of pluginConflicts) {
        if (pluginIds.has(conflictId)) {
          // Avoid duplicate conflict entries
          const existing = conflicts.find(
            (c) =>
              (c.pluginId === plugin.id && c.conflictsWith === conflictId) ||
              (c.pluginId === conflictId && c.conflictsWith === plugin.id),
          );

          if (!existing) {
            conflicts.push({
              pluginId: plugin.id,
              conflictsWith: conflictId,
              reason: `'${plugin.id}' and '${conflictId}' cannot be used together`,
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Topological sort for dependency order
   */
  private topologicalSort(plugins: Plugin[]): Plugin[] {
    const pluginMap = new Map(plugins.map((p) => [p.id, p]));
    const visited = new Set<string>();
    const result: Plugin[] = [];

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const plugin = pluginMap.get(id);
      if (!plugin) return;

      // Visit dependencies first
      const deps = plugin.dependencies ?? [];
      for (const dep of deps) {
        if (pluginMap.has(dep)) {
          visit(dep);
        }
      }

      result.push(plugin);
    };

    for (const plugin of plugins) {
      visit(plugin.id);
    }

    return result;
  }

  /**
   * Generate warnings for plugin selection
   */
  generateWarnings(plugins: Plugin[]): string[] {
    const warnings: string[] = [];
    const pluginIds = new Set(plugins.map((p) => p.id));

    // Check for recommended combinations
    if (pluginIds.has("tailwindcss") && !pluginIds.has("shadcn-ui")) {
      warnings.push(
        "Consider adding 'shadcn-ui' for pre-built Tailwind components",
      );
    }

    if (pluginIds.has("drizzle") && !pluginIds.has("docker")) {
      warnings.push(
        "Consider adding 'docker' for easy database development setup",
      );
    }

    if (pluginIds.has("better-auth") && !pluginIds.has("redis")) {
      warnings.push(
        "Consider adding 'redis' for session storage with Better Auth",
      );
    }

    return warnings;
  }

  /**
   * Get all dependencies for a plugin (recursive)
   */
  getAllDependencies(pluginId: string): string[] {
    const deps = new Set<string>();
    const toProcess = [pluginId];

    while (toProcess.length > 0) {
      const id = toProcess.pop()!;
      if (deps.has(id) || id === pluginId) continue;

      if (this.registry.has(id)) {
        deps.add(id);
        const plugin = this.registry.get(id);
        const pluginDeps = plugin.dependencies ?? [];
        toProcess.push(...pluginDeps);
      }
    }

    return Array.from(deps);
  }

  /**
   * Get all plugins that depend on a given plugin
   */
  getDependents(pluginId: string): string[] {
    const dependents: string[] = [];

    for (const plugin of this.registry.getAll()) {
      const deps = plugin.dependencies ?? [];
      if (deps.includes(pluginId)) {
        dependents.push(plugin.id);
      }
    }

    return dependents;
  }
}
