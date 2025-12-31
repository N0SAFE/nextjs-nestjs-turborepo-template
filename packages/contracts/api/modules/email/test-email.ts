import { oc } from '@orpc/contract';
import { z } from 'zod';

/**
 * Test email configuration contract
 */
export const testEmailContract = oc
  .route({
    method: 'POST',
    path: '/test',
    summary: 'Test email configuration',
  })
  .input(
    z.object({
      to: z.string().email(),
    }),
  )
  .output(
    z.object({
      id: z.string(),
      success: z.boolean(),
      error: z.string().optional(),
    }),
  );
