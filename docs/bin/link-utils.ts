#!/usr/bin/env bun

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';

/**
 * Extract markdown links from a file
 * @param filePath - Absolute path to the markdown file
 * @param filter - Optional filter pattern (e.g., '*.md', 'ARCHITECTURE*.md')
 * @returns Array of absolute paths to linked files
 */
export const extractLinks = (filePath: string, filter = '*.md'): string[] => {
  if (!existsSync(filePath)) return [];
  
  let content = readFileSync(filePath, 'utf-8');
  
  // Remove code blocks (triple backticks) to avoid extracting links from examples
  content = content.replace(/```[\s\S]*?```/g, '');
  
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links: string[] = [];
  
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    let link = match[2];
    const linkStartIndex = match.index;
    
    // Check if this link is preceded by <!-- example --> comment
    // Look back up to 50 characters before the link
    const beforeLink = content.substring(Math.max(0, linkStartIndex - 50), linkStartIndex);
    if (beforeLink.includes('<!-- example -->')) {
      continue; // Skip example links
    }
    
    // Skip external links
    if (link.match(/^(https?|mailto|ftp):/)) continue;
    
    // Skip anchors
    if (link.startsWith('#')) continue;
    
    // Remove anchor from path
    link = link.split('#')[0];
    
    // Resolve relative paths from the file's directory
    const fileDir = dirname(filePath);
    const resolvedPath = resolve(fileDir, link);
    
    // Apply filter
    const matchesFilter = filter === '*.md' 
      ? resolvedPath.endsWith('.md')
      : resolvedPath.includes(filter.replace('*.', '').replace('.md', ''));
    
    if (matchesFilter) {
      links.push(resolvedPath);
    }
  }
  
  return [...new Set(links)]; // Remove duplicates
};

/**
 * Analyze links using breadth-first traversal
 * @param startFile - Starting file path
 * @param maxDepth - Maximum depth to traverse (Infinity for unlimited)
 * @param filter - File filter pattern
 * @returns Map of file path to file info
 */
export const analyzeLinksBreathFirst = <T extends { path: string; links: string[] }>(
  startFile: string,
  maxDepth: number,
  filter: string,
  createNodeInfo: (filePath: string, links: string[]) => T
): Map<string, T> => {
  const nodeMap = new Map<string, T>();
  const queue: { path: string; depth: number }[] = [{ path: startFile, depth: 0 }];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const { path: currentPath, depth } = queue.shift()!;
    
    if (visited.has(currentPath)) continue;
    visited.add(currentPath);
    
    // Extract links for this file
    const links = extractLinks(currentPath, filter);
    
    // Create node info
    const nodeInfo = createNodeInfo(currentPath, links);
    nodeMap.set(currentPath, nodeInfo);
    
    // Add linked files to queue if within depth limit
    if (depth < maxDepth) {
      for (const link of links) {
        if (!visited.has(link) && existsSync(link)) {
          queue.push({ path: link, depth: depth + 1 });
        }
      }
    }
  }
  
  return nodeMap;
};
