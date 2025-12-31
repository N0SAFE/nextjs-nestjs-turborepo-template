import { Injectable } from '@nestjs/common';
import type { SendEmailResult } from '../services/email.service';

export interface EmailResultContract {
  id: string;
  success: boolean;
  error?: string;
}

export interface BulkEmailResultContract {
  total: number;
  successful: number;
  failed: number;
  results: EmailResultContract[];
}

/**
 * Email Adapter following Service-Adapter pattern
 * Transforms email service results to API contract types
 */
@Injectable()
export class EmailAdapter {
  /**
   * Transform single email result to contract
   */
  toEmailResultContract(result: SendEmailResult): EmailResultContract {
    return {
      id: result.id,
      success: result.success,
      error: result.error,
    };
  }

  /**
   * Transform bulk email results to contract
   */
  toBulkEmailResultContract(
    results: SendEmailResult[],
  ): BulkEmailResultContract {
    const successful = results.filter((r) => r.success).length;
    const failed = results.length - successful;

    return {
      total: results.length,
      successful,
      failed,
      results: results.map((r) => this.toEmailResultContract(r)),
    };
  }
}
