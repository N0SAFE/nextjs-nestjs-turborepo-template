#!/usr/bin/env bun

import { existsSync } from 'fs';
import { resolve, relative, dirname, basename } from 'path';
import { extractLinks, analyzeLinksBreathFirst } from './link-utils';

interface Options {
  file: string;
  depth: number;
  filter: string;
  verbose?: boolean;
  help?: boolean;
}

interface LinkInfo {
  path: string;
  displayPath: string;
  exists: boolean;
  links: string[];
}

const DOCS_ROOT = resolve(__dirname, '../..');

// Analyze links using breadth-first traversal
const analyzeLinks = (
  filePath: string,
  maxDepth: number,
  filter: string
): Map<string, LinkInfo> => {
  return analyzeLinksBreathFirst(
    filePath,
    maxDepth,
    filter,
    (path: string, links: string[]) => ({
      path,
      displayPath: relative(DOCS_ROOT, path) || basename(path),
      exists: existsSync(path),
      links,
    })
  );
};

// Print link tree using breadth-first display order
const printTree = (
  startFile: string,
  linkMap: Map<string, LinkInfo>,
  maxDepth: number,
  verbose: boolean = false
): void => {
  const queue: { path: string; depth: number; parentIndent: string }[] = [
    { path: startFile, depth: 0, parentIndent: '' }
  ];
  const visited = new Set<string>();
  
  // Group by depth for breadth-first display
  const depthLevels: Array<Array<{ path: string; indent: string }>> = [];
  
  while (queue.length > 0) {
    const { path, depth, parentIndent } = queue.shift()!;
    
    if (visited.has(path)) continue;
    visited.add(path);
    
    // Ensure depth level exists
    while (depthLevels.length <= depth) {
      depthLevels.push([]);
    }
    
    const indent = depth === 0 ? '' : parentIndent + '  ';
    depthLevels[depth].push({ path, indent });
    
    const info = linkMap.get(path);
    if (!info || depth >= maxDepth) continue;
    
    // Queue children for next level
    for (const link of info.links) {
      if (!visited.has(link)) {
        const childIndent = depth === 0 ? '  ' : indent + '  ';
        queue.push({ path: link, depth: depth + 1, parentIndent: childIndent });
      }
    }
  }
  
  // Display level by level (breadth-first)
  const alreadyShown = new Set<string>();
  
  for (let level = 0; level < depthLevels.length; level++) {
    const nodes = depthLevels[level];
    
    for (const { path, indent } of nodes) {
      const info = linkMap.get(path);
      if (!info) continue;
      
      if (alreadyShown.has(path)) {
        console.log(`${indent}\x1b[33m↻ ${info.displayPath} (already visited)\x1b[0m`);
        continue;
      }
      
      alreadyShown.add(path);
      
      // Print current file
      console.log(`${indent}\x1b[34m📄 ${info.displayPath}\x1b[0m`);
      
      if (info.links.length === 0) {
        continue;
      }
      
      if (verbose) {
        console.log(`${indent}  \x1b[32m→ ${info.links.length} link(s)\x1b[0m`);
      }
      
      // Only show link details if we haven't reached max depth or in verbose mode
      if (level < maxDepth || verbose) {
        // Show what links this file has (without recursing)
        for (const link of info.links) {
          const linkInfo = linkMap.get(link);
          if (!linkInfo) {
            // Check if file actually exists (truly broken) vs just outside depth limit
            if (existsSync(link)) {
              // File exists but wasn't traversed (outside depth or filtered)
              if (verbose) {
                const rel = relative(DOCS_ROOT, link);
                console.log(`${indent}    \x1b[90m○ ${rel} (outside depth/filter)\x1b[0m`);
              }
            } else {
              // File doesn't exist (truly broken)
              const rel = relative(DOCS_ROOT, link);
              console.log(`${indent}    \x1b[31m✗ ${rel} (not found)\x1b[0m`);
            }
          } else if (alreadyShown.has(link)) {
            console.log(`${indent}    \x1b[33m↻ ${linkInfo.displayPath} (already visited)\x1b[0m`);
          } else {
            // Just show it will be expanded later
            console.log(`${indent}    \x1b[36m📄 ${linkInfo.displayPath}\x1b[0m`);
          }
        }
      }
    }
  }
};

// Calculate statistics
const getStatistics = (linkMap: Map<string, LinkInfo>): {
  totalFiles: number;
  totalLinks: number;
  brokenLinks: number;
} => {
  let totalFiles = 0;
  let totalLinks = 0;
  let brokenLinks = 0;
  
  linkMap.forEach((info) => {
    totalFiles++;
    totalLinks += info.links.length;
    
    for (const link of info.links) {
      // Only count as broken if file doesn't exist (not just outside depth limit)
      if (!linkMap.has(link) && !existsSync(link)) {
        brokenLinks++;
      }
    }
  });
  
  return { totalFiles, totalLinks, brokenLinks };
};

// Parse command line arguments
const parseArgs = (args: string[]): Options => {
  const options: Options = {
    file: '',
    depth: Infinity, // Default to unlimited depth
    filter: '*.md',
    verbose: false,
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--file':
        options.file = args[++i];
        break;
      case '--depth':
        options.depth = parseInt(args[++i], 10);
        break;
      case '--filter':
        options.filter = args[++i];
        break;
      case '-v':
      case '--verbose':
        options.verbose = true;
        break;
      case '-h':
      case '--help':
        options.help = true;
        break;
    }
  }
  
  return options;
};

// Show help
const showHelp = () => {
  console.log(`
Usage: bun run check-doc-links.ts --file <path> [--depth <number>] [--filter <pattern>] [--verbose]

Analyze documentation links and their relationships.

Options:
  --file <path>        Path to the markdown file to analyze (required)
  --depth <number>     Recursion depth for following links (default: unlimited)
  --filter <pattern>   File pattern to filter results (default: *.md)
  -v, --verbose        Show detailed information (link counts, etc.)
  -h, --help          Show this help message

Examples:
  # Analyze single file
  bun run check-doc-links.ts --file docs/README.md

  # Follow links 2 levels deep
  bun run check-doc-links.ts --file docs/README.md --depth 2

  # Filter specific patterns
  bun run check-doc-links.ts --file docs/README.md --filter "ARCHITECTURE*.md"

  # Show detailed information with link counts
  bun run check-doc-links.ts --file docs/README.md --verbose

Output:
  - List of all linked documentation files
  - Relationship tree showing link structure
  - Statistics on link counts and depth
`);
};

// Main
const main = () => {
  const options = parseArgs(process.argv.slice(2));
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  if (!options.file) {
    console.error('\x1b[31mError: --file is required\x1b[0m');
    console.error('Use --help for usage information');
    process.exit(1);
  }
  
  // Resolve file path
  const filePath = resolve(options.file);
  
  if (!existsSync(filePath)) {
    console.error(`\x1b[31mError: File not found: ${filePath}\x1b[0m`);
    process.exit(1);
  }
  
  // Analyze links
  console.log('\x1b[32m=== Documentation Link Analysis ===\x1b[0m');
  console.log(`File: \x1b[34m${filePath}\x1b[0m`);
  console.log(`Depth: \x1b[33m${options.depth === Infinity ? 'unlimited' : options.depth}\x1b[0m`);
  console.log(`Filter: \x1b[33m${options.filter}\x1b[0m`);
  console.log('');
  
  const linkMap = analyzeLinks(filePath, options.depth, options.filter);
  
  console.log('\x1b[32m=== Link Tree (Breadth-First) ===\x1b[0m');
  printTree(filePath, linkMap, options.depth, options.verbose);
  console.log('');
  
  // Statistics
  const stats = getStatistics(linkMap);
  console.log('\x1b[32m=== Statistics ===\x1b[0m');
  console.log(`Total files analyzed: \x1b[34m${stats.totalFiles}\x1b[0m`);
  console.log(`Total links found: \x1b[34m${stats.totalLinks}\x1b[0m`);
  console.log(`Broken links: \x1b[31m${stats.brokenLinks}\x1b[0m`);
  console.log(`Unique files visited: \x1b[34m${linkMap.size}\x1b[0m`);
  
  if (stats.brokenLinks > 0) {
    console.log('');
    console.log(`\x1b[33m⚠️  Found ${stats.brokenLinks} broken link(s). Review the tree above.\x1b[0m`);
    process.exit(1);
  }
};

main();
