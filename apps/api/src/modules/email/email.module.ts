import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { EmailController } from './controllers/email.controller';
import { EmailAdapter } from './adapters/email.adapter';

/**
 * Email Module
 * Provides email sending functionality using Resend and React Email templates
 */
@Module({
  providers: [EmailService, EmailAdapter],
  controllers: [EmailController],
  exports: [EmailService], // Export service for use in other modules (e.g., auth)
})
export class EmailModule {}
