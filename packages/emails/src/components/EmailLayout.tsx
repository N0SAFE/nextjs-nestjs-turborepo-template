import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
} from '@react-email/components';

interface EmailLayoutProps {
  children: React.ReactNode;
  preview?: string;
}

/**
 * Base email layout wrapper with consistent styling
 * Provides responsive container and Tailwind CSS support
 */
export function EmailLayout({ children, preview }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 max-w-xl rounded-lg bg-white p-8 shadow-lg">
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
