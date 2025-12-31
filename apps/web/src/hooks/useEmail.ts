'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';
import { toast } from 'sonner';

/**
 * Email Hooks following ORPC Client Hooks Pattern
 * Provides type-safe email sending operations
 */

// ============================================================================
// Mutation Hooks (Write Operations)
// ============================================================================

/**
 * Send welcome email
 * @RequireRole('admin') on backend
 */
export function useSendWelcomeEmail() {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.email.sendWelcome.mutationOptions({
      onSuccess: (result) => {
        if (result.success) {
          toast.success('Welcome email sent successfully');
        } else {
          toast.error(`Failed to send email: ${result.error}`);
        }
      },
      onError: (error: Error) => {
        toast.error(`Failed to send welcome email: ${error.message}`);
      },
    })
  );
}

/**
 * Send email verification
 * @RequireRole('admin') on backend
 */
export function useSendVerificationEmail() {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.email.sendVerification.mutationOptions({
      onSuccess: (result) => {
        if (result.success) {
          toast.success('Verification email sent successfully');
        } else {
          toast.error(`Failed to send email: ${result.error}`);
        }
      },
      onError: (error: Error) => {
        toast.error(`Failed to send verification email: ${error.message}`);
      },
    })
  );
}

/**
 * Send password reset email
 * @RequireRole('admin') on backend
 */
export function useSendPasswordResetEmail() {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.email.sendPasswordReset.mutationOptions({
      onSuccess: (result) => {
        if (result.success) {
          toast.success('Password reset email sent successfully');
        } else {
          toast.error(`Failed to send email: ${result.error}`);
        }
      },
      onError: (error: Error) => {
        toast.error(`Failed to send password reset email: ${error.message}`);
      },
    })
  );
}

/**
 * Send notification email
 * @RequireRole('admin') on backend
 */
export function useSendNotificationEmail() {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.email.sendNotification.mutationOptions({
      onSuccess: (result) => {
        if (result.success) {
          toast.success('Notification email sent successfully');
        } else {
          toast.error(`Failed to send email: ${result.error}`);
        }
      },
      onError: (error: Error) => {
        toast.error(`Failed to send notification email: ${error.message}`);
      },
    })
  );
}

/**
 * Test email configuration
 * @RequireRole('admin') on backend
 */
export function useTestEmail() {
  return useMutation(
    orpc.email.test.mutationOptions({
      onSuccess: (result) => {
        if (result.success) {
          toast.success('Test email sent successfully');
        } else {
          toast.error(`Failed to send test email: ${result.error}`);
        }
      },
      onError: (error: Error) => {
        toast.error(`Failed to send test email: ${error.message}`);
      },
    })
  );
}

// ============================================================================
// Composite Utility Hooks
// ============================================================================

/**
 * Utility hook combining all email sending mutations
 * Provides convenient access to all email operations
 */
export function useEmailActions() {
  const sendWelcome = useSendWelcomeEmail();
  const sendVerification = useSendVerificationEmail();
  const sendPasswordReset = useSendPasswordResetEmail();
  const sendNotification = useSendNotificationEmail();
  const testEmail = useTestEmail();

  return {
    // Convenience methods
    sendWelcome: sendWelcome.mutate,
    sendWelcomeAsync: sendWelcome.mutateAsync,
    sendVerification: sendVerification.mutate,
    sendVerificationAsync: sendVerification.mutateAsync,
    sendPasswordReset: sendPasswordReset.mutate,
    sendPasswordResetAsync: sendPasswordReset.mutateAsync,
    sendNotification: sendNotification.mutate,
    sendNotificationAsync: sendNotification.mutateAsync,
    testEmail: testEmail.mutate,
    testEmailAsync: testEmail.mutateAsync,

    // Grouped loading states
    isLoading: {
      welcome: sendWelcome.isPending,
      verification: sendVerification.isPending,
      passwordReset: sendPasswordReset.isPending,
      notification: sendNotification.isPending,
      test: testEmail.isPending,
    },

    // Grouped error states
    errors: {
      welcome: sendWelcome.error,
      verification: sendVerification.error,
      passwordReset: sendPasswordReset.error,
      notification: sendNotification.error,
      test: testEmail.error,
    },
  };
}

// ============================================================================
// Direct Functions (Server Components / Server Actions)
// ============================================================================

/**
 * Send welcome email (server-side)
 * @RequireRole('admin') on backend
 */
export async function sendWelcomeEmail(params: {
  to: string;
  userName: string;
  verificationUrl?: string;
}) {
  return orpc.email.sendWelcome.call(params);
}

/**
 * Send verification email (server-side)
 * @RequireRole('admin') on backend
 */
export async function sendVerificationEmail(params: {
  to: string;
  userName: string;
  verificationUrl: string;
  expiresIn?: string;
}) {
  return orpc.email.sendVerification.call(params);
}

/**
 * Send password reset email (server-side)
 * @RequireRole('admin') on backend
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  userName: string;
  resetUrl: string;
  expiresIn?: string;
}) {
  return orpc.email.sendPasswordReset.call(params);
}

/**
 * Send notification email (server-side)
 * @RequireRole('admin') on backend
 */
export async function sendNotificationEmail(params: {
  to: string;
  userName: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}) {
  return orpc.email.sendNotification.call(params);
}

/**
 * Test email configuration (server-side)
 * @RequireRole('admin') on backend
 */
export async function testEmail(params: { to: string }) {
  return orpc.email.test.call(params);
}

// ============================================================================
// Type Exports
// ============================================================================

export type EmailResult = Awaited<ReturnType<typeof sendWelcomeEmail>>;
export type EmailActions = ReturnType<typeof useEmailActions>;
