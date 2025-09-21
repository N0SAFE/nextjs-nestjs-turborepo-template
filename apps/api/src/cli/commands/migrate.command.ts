import { Command, CommandRunner } from 'nest-commander';
import { Injectable, Inject } from '@nestjs/common';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { DATABASE_CONNECTION } from '../../core/modules/database/database-connection';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../../config/drizzle/schema';

@Injectable()
@Command({ 
  name: 'migrate', 
  description: 'Run database migrations',
})
export class MigrateCommand extends CommandRunner {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async run(): Promise<void> {
    console.log('🔄 Running database migrations...');

    try {
      await migrate(this.db, { 
        migrationsFolder: './src/config/drizzle/migrations',
      });
      
      console.log('✅ Database migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
}