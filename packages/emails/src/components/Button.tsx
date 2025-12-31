import * as React from 'react';
import { Button as EmailButton } from '@react-email/components';

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

/**
 * Email button component with consistent styling
 */
export function Button({ href, children, variant = 'primary' }: ButtonProps) {
  const baseClasses = 'inline-block rounded-lg px-6 py-3 text-center font-semibold no-underline';
  const variantClasses = variant === 'primary'
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300';

  return (
    <EmailButton
      href={href}
      className={`${baseClasses} ${variantClasses}`}
    >
      {children}
    </EmailButton>
  );
}
