/**
 * Tests for DependencyVisualizer
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DependencyVisualizer } from '../src/selection/dependency-visualizer'
import type { FeaturePackage } from '../src/eject/types'

describe('DependencyVisualizer', () => {
  let mockFeatures: FeaturePackage[]
  let visualizer: DependencyVisualizer

  beforeEach(() => {
    mockFeatures = [
      {
        name: 'app',
        version: '1.0.0',
        description: 'Main App',
        type: 'framework',
        removable: true,
        dependencies: ['framework', 'ui-lib'],
      },
      {
        name: 'framework',
        version: '2.0.0',
        description: 'Framework',
        type: 'framework',
        removable: true,
        dependencies: ['core'],
      },
      {
        name: 'ui-lib',
        version: '1.5.0',
        description: 'UI Library',
        type: 'library',
        removable: true,
        dependencies: ['core', 'styling'],
      },
      {
        name: 'core',
        version: '3.0.0',
        description: 'Core Module',
        type: 'library',
        removable: true,
        dependencies: [],
      },
      {
        name: 'styling',
        version: '1.0.0',
        description: 'Styling',
        type: 'config',
        removable: true,
        dependencies: [],
      },
    ]

    visualizer = new DependencyVisualizer(mockFeatures)
  })

  describe('createGraph', () => {
    it('should create dependency graph', () => {
      const graph = visualizer.createGraph()

      expect(graph.nodes.size).toBe(5)
      expect(graph.edges.length).toBeGreaterThan(0)
    })

    it('should identify root nodes', () => {
      const graph = visualizer.createGraph()

      // Root nodes are those with no dependencies (leaf nodes in dependency graph)
      expect(graph.rootNodes.length).toBeGreaterThan(0)
      // The actual root nodes are core and styling (no dependencies)
      expect(graph.rootNodes).toContain('core')
    })

    it('should identify leaf nodes', () => {
      const graph = visualizer.createGraph()

      // Leaf nodes are those that nothing depends on (top-level in tree)
      expect(graph.leafNodes.length).toBeGreaterThan(0)
      // The actual leaf nodes are 'app' (nothing depends on it)
      expect(graph.leafNodes).toContain('app')
    })

    it('should calculate node levels', () => {
      const graph = visualizer.createGraph()

      const appNode = graph.nodes.get('app')
      const coreNode = graph.nodes.get('core')

      // app depends on framework/ui-lib which depend on core
      // so app should have a lower level (higher up) than core
      expect(appNode?.level).toBeGreaterThan(coreNode!.level)
    })

    it('should set dependencies correctly', () => {
      const graph = visualizer.createGraph()

      const appNode = graph.nodes.get('app')
      expect(appNode?.dependencies).toContain('framework')
      expect(appNode?.dependencies).toContain('ui-lib')
    })

    it('should set dependents correctly', () => {
      const graph = visualizer.createGraph()

      const coreNode = graph.nodes.get('core')
      expect(coreNode?.dependents).toContain('framework')
      expect(coreNode?.dependents).toContain('ui-lib')
    })
  })

  describe('getSubgraph', () => {
    it('should extract subgraph for single feature', () => {
      const subgraph = visualizer.getSubgraph(['app'])

      expect(subgraph.nodes.size).toBeGreaterThanOrEqual(1)
      expect(subgraph.nodes.has('app')).toBe(true)
    })

    it('should include dependencies in subgraph', () => {
      const subgraph = visualizer.getSubgraph(['app'])

      expect(subgraph.nodes.has('framework')).toBe(true)
      expect(subgraph.nodes.has('ui-lib')).toBe(true)
      expect(subgraph.nodes.has('core')).toBe(true)
    })

    it('should filter edges correctly', () => {
      const subgraph = visualizer.getSubgraph(['ui-lib'])

      const invalidEdges = subgraph.edges.filter(
        (e) => !subgraph.nodes.has(e.from) || !subgraph.nodes.has(e.to)
      )
      expect(invalidEdges.length).toBe(0)
    })

    it('should handle multiple features', () => {
      const subgraph = visualizer.getSubgraph(['app', 'ui-lib'])

      expect(subgraph.nodes.has('app')).toBe(true)
      expect(subgraph.nodes.has('ui-lib')).toBe(true)
    })
  })

  describe('getDependencyPath', () => {
    it('should find direct dependency path', () => {
      const path = visualizer.getDependencyPath('app', 'core')

      expect(path).not.toBeNull()
      expect(path).toContain('app')
      expect(path).toContain('core')
    })

    it('should find indirect dependency path', () => {
      const path = visualizer.getDependencyPath('app', 'styling')

      expect(path).not.toBeNull()
      expect(path?.[0]).toBe('app')
      expect(path?.[path.length - 1]).toBe('styling')
    })

    it('should return null for non-existent path', () => {
      const path = visualizer.getDependencyPath('core', 'app')

      expect(path).toBeNull()
    })

    it('should return single element for same feature', () => {
      const path = visualizer.getDependencyPath('app', 'app')

      expect(path).not.toBeNull()
      expect(path).toHaveLength(1)
    })
  })

  describe('getTransitiveDependencies', () => {
    it('should get all transitive dependencies', () => {
      const deps = visualizer.getTransitiveDependencies('app')

      expect(deps.size).toBeGreaterThan(0)
      expect(deps.has('framework')).toBe(true)
      expect(deps.has('core')).toBe(true)
    })

    it('should not include self', () => {
      const deps = visualizer.getTransitiveDependencies('app')

      expect(deps.has('app')).toBe(false)
    })

    it('should include indirect dependencies', () => {
      const deps = visualizer.getTransitiveDependencies('app')

      expect(deps.has('styling')).toBe(true)
    })
  })

  describe('getReverseDependencies', () => {
    it('should get direct reverse dependencies', () => {
      const deps = visualizer.getReverseDependencies('core')

      expect(deps.size).toBeGreaterThan(0)
      expect(deps.has('framework')).toBe(true)
    })

    it('should get transitive reverse dependencies', () => {
      const deps = visualizer.getReverseDependencies('core')

      expect(deps.has('app')).toBe(true)
    })

    it('should not include self', () => {
      const deps = visualizer.getReverseDependencies('core')

      expect(deps.has('core')).toBe(false)
    })
  })

  describe('visualizeAscii', () => {
    it('should generate ASCII visualization', () => {
      const graph = visualizer.createGraph()
      const ascii = visualizer.visualizeAscii(graph)

      expect(ascii).toContain('Dependency Graph')
      expect(ascii.length).toBeGreaterThan(0)
      // Tree may contain various format representations
      expect(ascii.length).toBeGreaterThan(15)
    })

    it('should include feature names', () => {
      const graph = visualizer.createGraph()
      const ascii = visualizer.visualizeAscii(graph)

      // The ASCII output should contain the root nodes (core, styling)
      expect(ascii).toContain('core')
      expect(ascii).toContain('styling')
    })

    it('should include tree structure markers', () => {
      const graph = visualizer.createGraph()
      const ascii = visualizer.visualizeAscii(graph)

      expect(ascii).toMatch(/[├─│]/)
    })
  })

  describe('summarizeGraph', () => {
    it('should generate graph summary', () => {
      const graph = visualizer.createGraph()
      const summary = visualizer.summarizeGraph(graph)

      expect(summary).toContain('Summary')
      expect(summary).toContain('Nodes')
      expect(summary).toContain('Edges')
    })

    it('should include node count', () => {
      const graph = visualizer.createGraph()
      const summary = visualizer.summarizeGraph(graph)

      expect(summary).toContain(graph.nodes.size.toString())
    })

    it('should include depth information', () => {
      const graph = visualizer.createGraph()
      const summary = visualizer.summarizeGraph(graph)

      expect(summary).toContain('Deepest')
    })

    it('should count edge types', () => {
      const graph = visualizer.createGraph()
      const summary = visualizer.summarizeGraph(graph)

      expect(summary).toContain('Dependencies')
    })
  })

  describe('complex graph structures', () => {
    it('should handle diamond dependency', () => {
      const diamondFeatures: FeaturePackage[] = [
        {
          name: 'top',
          version: '1.0.0',
          description: 'Top',
          type: 'library',
          removable: true,
          dependencies: ['left', 'right'],
        },
        {
          name: 'left',
          version: '1.0.0',
          description: 'Left',
          type: 'library',
          removable: true,
          dependencies: ['bottom'],
        },
        {
          name: 'right',
          version: '1.0.0',
          description: 'Right',
          type: 'library',
          removable: true,
          dependencies: ['bottom'],
        },
        {
          name: 'bottom',
          version: '1.0.0',
          description: 'Bottom',
          type: 'library',
          removable: true,
          dependencies: [],
        },
      ]

      const diamondVisualizer = new DependencyVisualizer(diamondFeatures)
      const graph = diamondVisualizer.createGraph()

      expect(graph.nodes.size).toBe(4)
      const path = diamondVisualizer.getDependencyPath('top', 'bottom')
      expect(path).not.toBeNull()
    })

    it('should handle linear dependencies', () => {
      const linearFeatures: FeaturePackage[] = [
        {
          name: 'a',
          version: '1.0.0',
          description: 'A',
          type: 'library',
          removable: true,
          dependencies: ['b'],
        },
        {
          name: 'b',
          version: '1.0.0',
          description: 'B',
          type: 'library',
          removable: true,
          dependencies: ['c'],
        },
        {
          name: 'c',
          version: '1.0.0',
          description: 'C',
          type: 'library',
          removable: true,
          dependencies: [],
        },
      ]

      const linearVisualizer = new DependencyVisualizer(linearFeatures)
      const graph = linearVisualizer.createGraph()

      const deps = linearVisualizer.getTransitiveDependencies('a')
      expect(deps.size).toBe(2)
      expect(deps.has('b')).toBe(true)
      expect(deps.has('c')).toBe(true)
    })
  })
})
