import { Module } from '@nestjs/common';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { PackageService } from './services/package.service.js';
import { CommandService } from './services/command.service.js';
import { ScaffoldService } from './services/scaffold.service.js';
import { ResourceService } from './services/resource.service.js';
import { DependencyService } from './services/dependency.service.js';
import { PackageToolsProvider } from './tools/package.tools.js';
import { CommandToolsProvider } from './tools/command.tools.js';
import { ScaffoldToolsProvider } from './tools/scaffold.tools.js';
import { ResourceToolsProvider } from './tools/resource.tools.js';
import { DependencyToolsProvider } from './tools/dependency.tools.js';
import { ResourceProvider } from './providers/resource.provider.js';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'repo-manager',
      version: '1.0.0',
      transport: McpTransportType.STDIO,
    }),
  ],
  providers: [
    PackageService,
    CommandService,
    ScaffoldService,
    ResourceService,
    DependencyService,
    PackageToolsProvider,
    CommandToolsProvider,
    ScaffoldToolsProvider,
    ResourceToolsProvider,
    DependencyToolsProvider,
    ResourceProvider,
  ],
})
export class AppModule {}
