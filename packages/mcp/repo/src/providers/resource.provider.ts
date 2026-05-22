import { Injectable } from '@nestjs/common';
import { Resource } from '@rekog/mcp-nest';
import { ResourceService } from '../services/resource.service.js';

@Injectable()
export class ResourceProvider {
  constructor(private readonly resourceService: ResourceService) {}

  @Resource({
    uri: 'repo://summary',
    name: 'Repository Summary',
    description: 'High-level overview of the monorepo structure and statistics',
    mimeType: 'application/json',
  })
  async getRepoSummary() {
    const summary = await this.resourceService.getRepoSummary();
    return JSON.stringify(summary, null, 2);
  }

  @Resource({
    uri: 'repo://apps',
    name: 'Applications List',
    description: 'List of all applications in the apps/ directory',
    mimeType: 'application/json',
  })
  async getAppsList() {
    const apps = await this.resourceService.listAppNames();
    return JSON.stringify(apps, null, 2);
  }

  @Resource({
    uri: 'repo://packages',
    name: 'Packages List',
    description: 'List of all packages in the packages/ directory',
    mimeType: 'application/json',
  })
  async getPackagesList() {
    const packages = await this.resourceService.listPackageNames();
    return JSON.stringify(packages, null, 2);
  }

  @Resource({
    uri: 'repo://structure',
    name: 'Repository Structure',
    description: 'Directory tree structure of the repository (max depth 3)',
    mimeType: 'application/json',
  })
  async getRepoStructure() {
    const structure = await this.resourceService.getRepoStructure();
    return JSON.stringify(structure, null, 2);
  }

  @Resource({
    uri: 'repo://stats',
    name: 'Repository Statistics',
    description: 'Statistics about packages, apps, files, and lines of code',
    mimeType: 'application/json',
  })
  async getRepoStats() {
    const stats = await this.resourceService.getRepoStats();
    return JSON.stringify(stats, null, 2);
  }

  @Resource({
    uri: 'repo://agents',
    name: 'AGENTS.md Files Index',
    description: 'List of all AGENTS.md files in the repository',
    mimeType: 'application/json',
  })
  async getAgentsIndex() {
    const agents = await this.resourceService.getAgentFiles();
    const index = agents.map((a) => ({
      scope: a.scope,
      target: a.target,
      path: a.path,
      lastModified: a.lastModified,
    }));
    return JSON.stringify(index, null, 2);
  }

  @Resource({
    uri: 'repo://agent/root',
    name: 'Root AGENTS.md',
    description: 'Content of the root AGENTS.md file',
    mimeType: 'text/markdown',
  })
  async getRootAgent() {
    const agent = await this.resourceService.getAgentFile('root');
    return agent?.content || 'AGENTS.md not found';
  }
}
