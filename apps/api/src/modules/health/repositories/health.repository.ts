import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../core/modules/database/services/database.service';

@Injectable()
export class HealthRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    const startTime = Date.now();
    
    try {
      // Try to perform a simple query
      await this.databaseService.db.execute('SELECT 1');
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  /**
   * Get system memory information
   */
  getMemoryInfo() {
    const memUsage = process.memoryUsage();
    
    return {
      used: memUsage.heapUsed,
      free: memUsage.heapTotal - memUsage.heapUsed,
      total: memUsage.heapTotal,
    };
  }

  /**
   * Get process uptime
   */
  getUptime() {
    return process.uptime();
  }
}
