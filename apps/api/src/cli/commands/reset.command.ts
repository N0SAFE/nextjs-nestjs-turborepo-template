import { Command, CommandRunner } from 'nest-commander';
import { Injectable, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../core/modules/database/database-connection';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../../config/drizzle/schema';

@Injectable()
@Command({ 
  name: 'reset', 
  description: 'Reset the database by dropping and recreating the public schema',
})
export class ResetCommand extends CommandRunner {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async run(): Promise<void> {
    console.log('🔄 Resetting database...');

    try {
      // Drop all tables
      await this.db.execute(sql`DROP SCHEMA public CASCADE`);
      await this.db.execute(sql`CREATE SCHEMA public`);
      await this.db.execute(sql`GRANT ALL ON SCHEMA public TO postgres`);
      await this.db.execute(sql`GRANT ALL ON SCHEMA public TO public`);
      
      console.log('✅ Database reset completed');
    } catch (error) {
      console.error('❌ Reset failed:', error);
      throw error;
    }
  }
}