# @repo/emails

Email templates package using React Email and Resend.

## Features

- **React Email Components**: Build beautiful, responsive emails with React
- **Reusable Templates**: Pre-built templates for common use cases (welcome, verification, password reset, notifications)
- **Type-Safe**: Full TypeScript support with prop types
- **Preview Server**: Live preview of emails during development
- **Tailwind CSS**: Style emails with Tailwind CSS classes

## Templates

### WelcomeEmail
Welcome email for new users with optional verification link.

### EmailVerification
Email verification template with expiring verification link.

### PasswordResetEmail
Password reset email with secure reset link.

### NotificationEmail
Generic notification email for various use cases.

## Development

### Preview Emails

Start the React Email dev server to preview templates:

```bash
bun run dev
```

This will start a server at `http://localhost:3002` where you can preview all email templates.

### Build

```bash
bun run build
```

### Export

Export templates as static HTML:

```bash
bun run export
```

## Usage

### In API Service

```typescript
import { EmailService } from '@/modules/email/services/email.service';

// Inject service
constructor(private readonly emailService: EmailService) {}

// Send welcome email
await this.emailService.sendWelcomeEmail('user@example.com', {
  userName: 'John Doe',
  verificationUrl: 'https://example.com/verify?token=abc123',
});
```

### Direct Template Usage

```typescript
import { WelcomeEmail, renderEmail } from '@repo/emails';
import * as React from 'react';

const component = React.createElement(WelcomeEmail, {
  userName: 'John Doe',
  verificationUrl: 'https://example.com/verify',
});

const html = await renderEmail(component);
```

## Creating New Templates

1. Create a new component in `src/templates/`
2. Export it from `src/index.ts`
3. Add a preview file in `emails/` directory
4. Build the package

Example:

```tsx
// src/templates/CustomEmail.tsx
import * as React from 'react';
import { EmailLayout } from '../components/EmailLayout';
import { EmailHeader } from '../components/EmailHeader';
import { EmailFooter } from '../components/EmailFooter';

export interface CustomEmailProps {
  userName: string;
  customMessage: string;
}

export function CustomEmail({ userName, customMessage }: CustomEmailProps) {
  return (
    <EmailLayout preview="Custom notification">
      <EmailHeader title="Custom Message" />
      <p>Hi {userName},</p>
      <p>{customMessage}</p>
      <EmailFooter />
    </EmailLayout>
  );
}
```

## Components

### EmailLayout
Base layout wrapper with responsive container and Tailwind CSS support.

### EmailHeader
Consistent header with title and optional subtitle.

### EmailFooter
Branded footer with copyright and disclaimer.

### Button
Styled button component with primary/secondary variants.

## Environment Variables

Email sending is configured in the API with these environment variables:

- `RESEND_API_KEY`: Your Resend API key
- `EMAIL_FROM`: Default sender email address (e.g., `noreply@example.com`)

## Related Documentation

- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email/docs)
- API Email Service: `apps/api/src/modules/email/`
