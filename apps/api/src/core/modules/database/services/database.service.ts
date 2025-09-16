import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database-connection';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@/config/drizzle/schema';

// Define the proper database type with schema
export type Database = NodePgDatabase<typeof schema>;

@Injectable()
export class DatabaseService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly _db: Database) {
    if (!this._db) {
      throw new Error('Database connection is not initialized');
    }
  }
  
  /**
   * Get the Drizzle database instance
   * This provides direct access to the Drizzle ORM with full schema typing
   */
  get db(): Database {
    return this._db;
  }

  /**
   * Health check method to verify database connectivity
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Simple query to check if database is accessible
      await this._db.execute('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get database connection info (without sensitive data)
   */
  getConnectionInfo(): { 
    hasConnection: boolean;
    databaseUrl: string; 
  } {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/mydb';
    // Remove password from the URL for logging
    const sanitizedUrl = connectionString.replace(/:([^:]+)@/, ':***@');
    
    return {
      hasConnection: !!this._db,
      databaseUrl: sanitizedUrl,
    };
  }
}
