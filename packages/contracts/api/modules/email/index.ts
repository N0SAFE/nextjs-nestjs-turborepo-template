import { oc } from '@orpc/contract';
import { sendWelcomeContract } from './send-welcome';
import { sendVerificationContract } from './send-verification';
import { sendPasswordResetContract } from './send-password-reset';
import { sendNotificationContract } from './send-notification';
import { testEmailContract } from './test-email';

/**
 * Email module contract - aggregates all email endpoints
 */
export const emailContract = oc
  .tag('Email')
  .prefix('/email')
  .router({
    sendWelcome: sendWelcomeContract,
    sendVerification: sendVerificationContract,
    sendPasswordReset: sendPasswordResetContract,
    sendNotification: sendNotificationContract,
    test: testEmailContract,
  });
