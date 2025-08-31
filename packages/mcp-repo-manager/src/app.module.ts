import { Module } from '@nestjs/common';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { RepoTools } from './tools/repo.tools.js';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'mcp-repo-manager',
      version: '0.1.0',
      transport: McpTransportType.STDIO,
      // You can later switch to SSE/Streamable HTTP if needed
    }),
  ],
  providers: [RepoTools],
})
export class AppModule {}
