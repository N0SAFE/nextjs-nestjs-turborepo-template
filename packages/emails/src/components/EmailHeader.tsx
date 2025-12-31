import * as React from 'react';
import { Heading, Text } from '@react-email/components';

interface EmailHeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * Email header component with consistent branding
 */
export function EmailHeader({ title, subtitle }: EmailHeaderProps) {
  return (
    <div className="mb-8 text-center">
      <Heading className="mb-2 text-3xl font-bold text-gray-900">
        {title}
      </Heading>
      {subtitle && (
        <Text className="text-base text-gray-600">{subtitle}</Text>
      )}
    </div>
  );
}
