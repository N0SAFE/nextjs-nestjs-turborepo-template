import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { EmailLayout } from '../components/EmailLayout';
import { EmailHeader } from '../components/EmailHeader';
import { EmailFooter } from '../components/EmailFooter';
import { Button } from '../components/Button';

export interface WelcomeEmailProps {
  userName: string;
  verificationUrl?: string;
}

/**
 * Welcome email sent to new users
 * Includes optional email verification link
 */
export function WelcomeEmail({ userName, verificationUrl }: WelcomeEmailProps) {
  return (
    <EmailLayout preview={`Welcome to our platform, ${userName}!`}>
      <EmailHeader
        title="Welcome!"
        subtitle="We're excited to have you on board"
      />

      <Section className="mb-6">
        <Text className="mb-4 text-base text-gray-700">
          Hi {userName},
        </Text>
        <Text className="mb-4 text-base text-gray-700">
          Thank you for joining us! We're thrilled to have you as part of our community.
        </Text>
        <Text className="mb-4 text-base text-gray-700">
          To get started, explore our features and don't hesitate to reach out if you need any help.
        </Text>
      </Section>

      {verificationUrl && (
        <Section className="my-6 text-center">
          <Button href={verificationUrl}>
            Verify Your Email
          </Button>
        </Section>
      )}

      <Section className="mt-6">
        <Text className="text-sm text-gray-600">
          If you have any questions, feel free to reply to this email or contact our support team.
        </Text>
      </Section>

      <EmailFooter />
    </EmailLayout>
  );
}

export default WelcomeEmail;
