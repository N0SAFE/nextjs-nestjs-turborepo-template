import { Controller } from '@nestjs/common';
import { Implement, implement } from '@orpc/nest';
import { emailContract } from '@repo/api-contracts';
import { EmailService } from '../services/email.service';
import { EmailAdapter } from '../adapters/email.adapter';
import { RequireRole } from '@/core/modules/auth/decorators/decorators';

/**
 * Email Controller following ORPC Implementation Pattern
 * Handles email sending operations via ORPC endpoints
 */
@Controller()
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly emailAdapter: EmailAdapter,
  ) {}

  /**
   * Send welcome email endpoint
   * @RequireRole('admin') - Only admins can send welcome emails manually
   */
  @RequireRole('admin')
  @Implement(emailContract.sendWelcome)
  sendWelcome() {
    return implement(emailContract.sendWelcome).handler(async ({ input }) => {
      const result = await this.emailService.sendWelcomeEmail(input.to, {
        userName: input.userName,
        verificationUrl: input.verificationUrl,
      });

      return this.emailAdapter.toEmailResultContract(result);
    });
  }

  /**
   * Send email verification endpoint
   * @RequireRole('admin') - Only admins can send verification emails manually
   */
  @RequireRole('admin')
  @Implement(emailContract.sendVerification)
  sendVerification() {
    return implement(emailContract.sendVerification).handler(
      async ({ input }) => {
        const result = await this.emailService.sendEmailVerification(
          input.to,
          {
            userName: input.userName,
            verificationUrl: input.verificationUrl,
            expiresIn: input.expiresIn,
          },
        );

        return this.emailAdapter.toEmailResultContract(result);
      },
    );
  }

  /**
   * Send password reset email endpoint
   * @RequireRole('admin') - Only admins can send password reset emails manually
   */
  @RequireRole('admin')
  @Implement(emailContract.sendPasswordReset)
  sendPasswordReset() {
    return implement(emailContract.sendPasswordReset).handler(
      async ({ input }) => {
        const result = await this.emailService.sendPasswordResetEmail(
          input.to,
          {
            userName: input.userName,
            resetUrl: input.resetUrl,
            expiresIn: input.expiresIn,
          },
        );

        return this.emailAdapter.toEmailResultContract(result);
      },
    );
  }

  /**
   * Send notification email endpoint
   * @RequireRole('admin') - Only admins can send notification emails
   */
  @RequireRole('admin')
  @Implement(emailContract.sendNotification)
  sendNotification() {
    return implement(emailContract.sendNotification).handler(
      async ({ input }) => {
        const result = await this.emailService.sendNotificationEmail(input.to, {
          userName: input.userName,
          title: input.title,
          message: input.message,
          actionUrl: input.actionUrl,
          actionText: input.actionText,
        });

        return this.emailAdapter.toEmailResultContract(result);
      },
    );
  }

  /**
   * Test email configuration endpoint
   * @RequireRole('admin') - Only admins can test email configuration
   */
  @RequireRole('admin')
  @Implement(emailContract.test)
  testEmail() {
    return implement(emailContract.test).handler(async ({ input }) => {
      const result = await this.emailService.testEmail(input.to);
      return this.emailAdapter.toEmailResultContract(result);
    });
  }
}
