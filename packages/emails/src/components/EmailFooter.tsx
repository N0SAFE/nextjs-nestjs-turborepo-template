import * as React from 'react';
import { Hr, Section, Text } from '@react-email/components';

/**
 * Email footer with consistent branding and links
 */
export function EmailFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <Section className="mt-8">
      <Hr className="my-6 border-gray-200" />
      <Text className="text-center text-sm text-gray-500">
        © {currentYear} Your Company. All rights reserved.
      </Text>
      <Text className="text-center text-xs text-gray-400">
        This email was sent to you because you have an account with us.
      </Text>
    </Section>
  );
}
