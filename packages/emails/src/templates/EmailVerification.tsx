import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { EmailLayout } from '../components/EmailLayout';
import { EmailHeader } from '../components/EmailHeader';
import { EmailFooter } from '../components/EmailFooter';
import { Button } from '../components/Button';

export interface EmailVerificationProps {
  userName: string;
  verificationUrl: string;
  expiresIn?: string;
}

/**
 * Email verification template
 * Sent to users to verify their email address
 */
export function EmailVerification({ userName, verificationUrl, expiresIn = '24 hours' }: EmailVerificationProps) {
  return (
    <EmailLayout preview="Verify your email address">
      <EmailHeader
        title="Verify Your Email"
        subtitle="One more step to get started"
      />

      <Section className="mb-6">
        <Text className="mb-4 text-base text-gray-700">
          Hi {userName},
        </Text>
        <Text className="mb-4 text-base text-gray-700">
          Please verify your email address by clicking the button below. This link will expire in {expiresIn}.
        </Text>
      </Section>

      <Section className="my-6 text-center">
        <Button href={verificationUrl}>
          Verify Email Address
        </Button>
      </Section>

      <Section className="mt-6">
        <Text className="text-sm text-gray-600">
          If you didn't create an account with us, you can safely ignore this email.
        </Text>
      </Section>

      <EmailFooter />
    </EmailLayout>
  );
}

export default EmailVerification;
