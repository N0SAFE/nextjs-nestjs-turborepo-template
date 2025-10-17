/**
 * Dependency Visualizer - Create visual representation of feature dependencies
 * Part of Phase 4: Feature Selection Enhancements
 */

import type { DependencyGraph, DependencyNode } from './types'
import type { FeaturePackage } from '../eject/types'

/**
 * Creates and visualizes dependency graphs
 */
export class DependencyVisualizer {
  private readonly features: Map<string, FeaturePackage>

  constructor(features: FeaturePackage[]) {
    this.features = new Map(features.map((f) => [f.name, f]))
  }

  /**
   * Create dependency graph from features
   */
  createGraph(): DependencyGraph {
    const nodes = new Map<string, DependencyNode>()
    const edges: Array<{ from: string; to: string; type: 'depends' | 'conflicts' }> = []

    // Create nodes
    for (const [name, feature] of this.features) {
      nodes.set(name, {
        id: name,
        feature,
        dependencies: feature.dependencies || [],
        dependents: [],
        level: 0,
      })
    }

    // Find dependents and create edges
    for (const [name, feature] of this.features) {
      // Dependencies
      if (feature.dependencies) {
        for (const dep of feature.dependencies) {
          if (nodes.has(dep)) {
            nodes.get(dep)!.dependents.push(name)
            edges.push({ from: name, to: dep, type: 'depends' })
          }
        }
      }

      // Conflicts
      if (feature.conflicts) {
        for (const conflict of feature.conflicts) {
          if (nodes.has(conflict)) {
            edges.push({ from: name, to: conflict, type: 'conflicts' })
          }
        }
      }
    }

    // Calculate levels (for tree visualization)
    this.calculateLevels(nodes)

    // Find root and leaf nodes
    const rootNodes: string[] = []
    const leafNodes: string[] = []

    for (const [name, node] of nodes) {
      if (node.dependencies.length === 0) {
        rootNodes.push(name)
      }
      if (node.dependents.length === 0) {
        leafNodes.push(name)
      }
    }

    return {
      nodes,
      edges,
      rootNodes,
      leafNodes,
    }
  }

  /**
   * Get subgraph for specific features
   */
  getSubgraph(featureNames: string[]): DependencyGraph {
    const fullGraph = this.createGraph()
    const subgraphNodes = new Map<string, DependencyNode>()
    const visited = new Set<string>()

    // Add selected features and their dependencies
    const queue = [...featureNames]
    while (queue.length > 0) {
      const name = queue.shift()!
      if (visited.has(name)) continue

      visited.add(name)

      const node = fullGraph.nodes.get(name)
      if (node) {
        subgraphNodes.set(name, node)

        // Add all dependencies
        for (const dep of node.dependencies) {
          if (!visited.has(dep)) {
            queue.push(dep)
          }
        }
      }
    }

    // Filter edges to only include subgraph nodes
    const subgraphEdges = fullGraph.edges.filter(
      (e) => subgraphNodes.has(e.from) && subgraphNodes.has(e.to)
    )

    // Find root and leaf nodes in subgraph
    const rootNodes = Array.from(subgraphNodes.keys()).filter(
      (name) => subgraphNodes.get(name)!.dependencies.length === 0
    )
    const leafNodes = Array.from(subgraphNodes.keys()).filter(
      (name) => subgraphNodes.get(name)!.dependents.length === 0
    )

    return {
      nodes: subgraphNodes,
      edges: subgraphEdges,
      rootNodes,
      leafNodes,
    }
  }

  /**
   * Visualize graph as ASCII art
   */
  visualizeAscii(graph: DependencyGraph): string {
    const lines: string[] = []
    const visited = new Set<string>()

    const renderNode = (name: string, depth: number, prefix: string) => {
      if (visited.has(name)) {
        lines.push(`${prefix}├─ ${name} (circular reference)`)
        return
      }

      visited.add(name)
      const node = graph.nodes.get(name)
      if (!node) return

      lines.push(`${prefix}├─ ${name}`)

      const deps = node.dependencies.filter((d) => graph.nodes.has(d))
      deps.forEach((dep, index) => {
        const isLast = index === deps.length - 1
        const nextPrefix = prefix + (isLast ? '  ' : '│ ')
        renderNode(dep, depth + 1, nextPrefix)
      })
    }

    lines.push('Dependency Graph:')
    lines.push('')

    // Start from root nodes
    graph.rootNodes.forEach((root) => {
      renderNode(root, 0, '')
    })

    return lines.join('\n')
  }

  /**
   * Get dependency path from feature to target
   */
  getDependencyPath(from: string, to: string): string[] | null {
    const path: string[] = []
    const visited = new Set<string>()

    const findPath = (current: string): boolean => {
      if (current === to) {
        path.push(current)
        return true
      }

      if (visited.has(current)) {
        return false
      }

      visited.add(current)

      const node = this.features.get(current)
      if (!node?.dependencies) {
        return false
      }

      for (const dep of node.dependencies) {
        if (findPath(dep)) {
          path.unshift(current)
          return true
        }
      }

      return false
    }

    if (findPath(from)) {
      return path
    }

    return null
  }

  /**
   * Get all transitive dependencies
   */
  getTransitiveDependencies(featureName: string): Set<string> {
    const deps = new Set<string>()
    const visited = new Set<string>()

    const collect = (name: string) => {
      if (visited.has(name)) return
      visited.add(name)

      const feature = this.features.get(name)
      if (!feature?.dependencies) return

      for (const dep of feature.dependencies) {
        deps.add(dep)
        collect(dep)
      }
    }

    collect(featureName)
    return deps
  }

  /**
   * Get all reverse dependencies (dependents)
   */
  getReverseDependencies(featureName: string): Set<string> {
    const dependents = new Set<string>()

    for (const [name, feature] of this.features) {
      if (name === featureName) continue

      if (feature.dependencies?.includes(featureName)) {
        dependents.add(name)
        // Get all dependents recursively
        for (const dep of this.getReverseDependencies(name)) {
          dependents.add(dep)
        }
      }
    }

    return dependents
  }

  /**
   * Calculate tree level for each node
   */
  private calculateLevels(nodes: Map<string, DependencyNode>): void {
    const levels = new Map<string, number>()

    const calculateLevel = (name: string): number => {
      if (levels.has(name)) {
        return levels.get(name)!
      }

      const node = nodes.get(name)
      if (!node) return 0

      let maxDepLevel = 0
      for (const dep of node.dependencies) {
        const depLevel = calculateLevel(dep)
        maxDepLevel = Math.max(maxDepLevel, depLevel)
      }

      const level = maxDepLevel + 1
      levels.set(name, level)
      node.level = level

      return level
    }

    for (const name of nodes.keys()) {
      calculateLevel(name)
    }
  }

  /**
   * Generate summary of graph structure
   */
  summarizeGraph(graph: DependencyGraph): string {
    const lines: string[] = []

    lines.push('Graph Summary:')
    lines.push(`  Total Nodes: ${graph.nodes.size}`)
    lines.push(`  Total Edges: ${graph.edges.length}`)
    lines.push(`  Root Nodes: ${graph.rootNodes.length}`)
    lines.push(`  Leaf Nodes: ${graph.leafNodes.length}`)

    // Count dependency types
    const depends = graph.edges.filter((e) => e.type === 'depends').length
    const conflicts = graph.edges.filter((e) => e.type === 'conflicts').length

    lines.push(`  Dependencies: ${depends}`)
    lines.push(`  Conflicts: ${conflicts}`)

    // Find deepest path
    let deepestPath = 0
    for (const root of graph.rootNodes) {
      const depth = this.getMaxDepth(root, graph)
      deepestPath = Math.max(deepestPath, depth)
    }

    lines.push(`  Deepest Dependency Path: ${deepestPath}`)

    return lines.join('\n')
  }

  /**
   * Get maximum depth from a node
   */
  private getMaxDepth(nodeName: string, graph: DependencyGraph): number {
    const node = graph.nodes.get(nodeName)
    if (!node || node.dependencies.length === 0) {
      return 1
    }

    let maxDepth = 0
    for (const dep of node.dependencies) {
      const depth = this.getMaxDepth(dep, graph)
      maxDepth = Math.max(maxDepth, depth)
    }

    return maxDepth + 1
  }
}
