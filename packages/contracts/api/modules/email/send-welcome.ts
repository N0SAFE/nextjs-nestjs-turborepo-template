import { oc } from '@orpc/contract';
import { z } from 'zod';

/**
 * Send welcome email contract
 */
export const sendWelcomeContract = oc
  .route({
    method: 'POST',
    path: '/welcome',
    summary: 'Send welcome email to a user',
  })
  .input(
    z.object({
      to: z.string().email(),
      userName: z.string(),
      verificationUrl: z.string().url().optional(),
    }),
  )
  .output(
    z.object({
      id: z.string(),
      success: z.boolean(),
      error: z.string().optional(),
    }),
  );
