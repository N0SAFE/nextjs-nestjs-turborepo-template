import { oc } from '@orpc/contract';
import { z } from 'zod';

/**
 * Send email verification contract
 */
export const sendVerificationContract = oc
  .route({
    method: 'POST',
    path: '/verification',
    summary: 'Send email verification to a user',
  })
  .input(
    z.object({
      to: z.string().email(),
      userName: z.string(),
      verificationUrl: z.string().url(),
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
