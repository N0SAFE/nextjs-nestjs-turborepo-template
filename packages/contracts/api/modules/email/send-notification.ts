import { oc } from '@orpc/contract';
import { z } from 'zod';

/**
 * Send notification email contract
 */
export const sendNotificationContract = oc
  .route({
    method: 'POST',
    path: '/notification',
    summary: 'Send notification email',
  })
  .input(
    z.object({
      to: z.string().email(),
      userName: z.string(),
      title: z.string(),
      message: z.string(),
      actionUrl: z.string().url().optional(),
      actionText: z.string().optional(),
    }),
  )
  .output(
    z.object({
      id: z.string(),
      success: z.boolean(),
      error: z.string().optional(),
    }),
  );
