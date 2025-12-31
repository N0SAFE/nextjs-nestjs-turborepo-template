import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { EmailLayout } from '../components/EmailLayout';
import { EmailHeader } from '../components/EmailHeader';
import { EmailFooter } from '../components/EmailFooter';
import { Button } from '../components/Button';

export interface NotificationEmailProps {
  userName: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

/**
 * Generic notification email template
 * Can be used for various notification types
 */
export function NotificationEmail({
  userName,
  title,
  message,
  actionUrl,
  actionText,
}: NotificationEmailProps) {
  return (
    <EmailLayout preview={title}>
      <EmailHeader title={title} />

      <Section className="mb-6">
        <Text className="mb-4 text-base text-gray-700">
          Hi {userName},
        </Text>
        <Text className="mb-4 text-base text-gray-700 whitespace-pre-wrap">
          {message}
        </Text>
      </Section>

      {actionUrl && actionText && (
        <Section className="my-6 text-center">
          <Button href={actionUrl}>
            {actionText}
          </Button>
        </Section>
      )}

      <EmailFooter />
    </EmailLayout>
  );
}

export default NotificationEmail;
