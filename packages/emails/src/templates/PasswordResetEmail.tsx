import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { EmailLayout } from '../components/EmailLayout';
import { EmailHeader } from '../components/EmailHeader';
import { EmailFooter } from '../components/EmailFooter';
import { Button } from '../components/Button';

export interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
  expiresIn?: string;
}

/**
 * Password reset email template
 * Sent when users request to reset their password
 */
export function PasswordResetEmail({ userName, resetUrl, expiresIn = '1 hour' }: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Reset your password">
      <EmailHeader
        title="Reset Your Password"
        subtitle="We received a request to reset your password"
      />

      <Section className="mb-6">
        <Text className="mb-4 text-base text-gray-700">
          Hi {userName},
        </Text>
        <Text className="mb-4 text-base text-gray-700">
          You recently requested to reset your password. Click the button below to create a new password. This link will expire in {expiresIn}.
        </Text>
      </Section>

      <Section className="my-6 text-center">
        <Button href={resetUrl}>
          Reset Password
        </Button>
      </Section>

      <Section className="mt-6">
        <Text className="text-sm text-gray-600">
          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </Text>
      </Section>

      <EmailFooter />
    </EmailLayout>
  );
}

export default PasswordResetEmail;
