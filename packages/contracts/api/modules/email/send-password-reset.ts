import { oc } from '@orpc/contract';
import { z } from 'zod';

/**
 * Send password reset email contract
 */
export const sendPasswordResetContract = oc
  .route({
    method: 'POST',
    path: '/password-reset',
    summary: 'Send password reset email',
  })
  .input(
    z.object({
      to: z.string().email(),
      userName: z.string(),
      resetUrl: z.string().url(),
      expiresIn: z.string().optional(),
    }),
  )
  .output(
    z.object({
      id: z.string(),
      success: z.boolean(),
      error: z.string().optional(),
    }),
  );
