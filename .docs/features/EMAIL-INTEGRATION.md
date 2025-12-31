# Email Integration with Resend and React Email

> **Type**: Feature Documentation  
> **Last Updated**: 2024-12-31  
> **Status**: ✅ Production Ready

## Overview

This project integrates **Resend** (email delivery API) with **React Email** (email template system) to provide a type-safe, maintainable, and scalable email solution. All email functionality follows the Service-Adapter pattern and ORPC implementation pattern for end-to-end type safety.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Email Architecture                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐      ┌──────────────┐               │
│  │ React Email  │      │   Resend     │               │
│  │  Templates   │──▶   │     API      │──▶ Delivery  │
│  │(@repo/emails)│      │  (API Key)   │               │
│  └──────────────┘      └──────────────┘               │
│         │                                               │
│         ▼                                               │
│  ┌──────────────┐                                      │
│  │Email Service │  (Service-Adapter Pattern)           │
│  │  (NestJS)    │                                      │
│  └──────────────┘                                      │
│         │                                               │
│         ▼                                               │
│  ┌──────────────┐                                      │
│  │ ORPC         │  (Type-safe API Contracts)           │
│  │ Endpoints    │                                      │
│  └──────────────┘                                      │
│         │                                               │
│         ▼                                               │
│  ┌──────────────┐                                      │
│  │ Frontend     │  (React Query Hooks)                 │
│  │ Hooks        │                                      │
│  └──────────────┘                                      │
└─────────────────────────────────────────────────────────┘
```

## Components

### 1. Email Templates Package (`@repo/emails`)

**Location**: `packages/emails/`

Provides reusable React Email templates with:
- TypeScript type safety
- Tailwind CSS styling
- Responsive design
- Development preview server

**Templates**:
- `WelcomeEmail` - New user welcome with optional verification
- `EmailVerification` - Email address verification
- `PasswordResetEmail` - Password reset with secure link
- `NotificationEmail` - Generic notification template

**Reusable Components**:
- `EmailLayout` - Base layout with responsive container
- `EmailHeader` - Consistent branding header
- `EmailFooter` - Footer with copyright and disclaimer
- `Button` - Styled CTA button (primary/secondary variants)

### 2. Email Service (`EmailService`)

**Location**: `apps/api/src/modules/email/services/email.service.ts`

Follows the **Service-Adapter Pattern**:
- Handles Resend API integration
- Renders React Email templates to HTML
- Manages email sending with retry logic
- Supports bulk email sending with batching
- Development mode with email mocking

**Key Methods**:
- `sendWelcomeEmail(to, props)` - Send welcome email
- `sendEmailVerification(to, props)` - Send verification email
- `sendPasswordResetEmail(to, props)` - Send password reset
- `sendNotificationEmail(to, props)` - Send notification
- `sendBulkEmails(recipients, subject, html)` - Bulk sending
- `testEmail(to)` - Test email configuration

### 3. ORPC Email Contracts

**Location**: `packages/contracts/api/modules/email/`

Type-safe API contracts with Zod validation:
- `sendWelcome` - POST `/email/welcome`
- `sendVerification` - POST `/email/verification`
- `sendPasswordReset` - POST `/email/password-reset`
- `sendNotification` - POST `/email/notification`
- `test` - POST `/email/test`

All endpoints require `@RequireRole('admin')` for security.

### 4. Frontend Hooks (`useEmail`)

**Location**: `apps/web/src/hooks/useEmail.ts`

Follows **ORPC Client Hooks Pattern**:
- `useSendWelcomeEmail()` - Welcome email mutation
- `useSendVerificationEmail()` - Verification email mutation
- `useSendPasswordResetEmail()` - Password reset mutation
- `useSendNotificationEmail()` - Notification mutation
- `useTestEmail()` - Test email mutation
- `useEmailActions()` - Composite hook with all operations

## Setup & Configuration

### 1. Environment Variables

Add to `.env`:

```bash
# Email Configuration (Resend)
RESEND_API_KEY=re_xxx  # Get from https://resend.com/api-keys
EMAIL_FROM=noreply@yourdomain.com  # Your verified sender domain
```

**Get Resend API Key**:
1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Create an API key
4. Add to environment variables

### 2. Install Dependencies

Dependencies are already configured in the monorepo:

```bash
# Install all dependencies
bun install

# Build email templates package
bun run @repo/emails -- build
```

### 3. Preview Email Templates

Start the React Email development server:

```bash
# From root
bun run @repo/emails -- dev

# Or from packages/emails
cd packages/emails
bun run dev
```

Access at: `http://localhost:3002`

## Usage Examples

### Backend (API Service)

```typescript
import { EmailService } from '@/modules/email/services/email.service';

@Injectable()
export class UserService {
  constructor(private readonly emailService: EmailService) {}

  async createUser(data: CreateUserDto) {
    const user = await this.userRepository.create(data);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, {
      userName: user.name,
      verificationUrl: `${process.env.APP_URL}/verify?token=${user.verificationToken}`,
    });

    return user;
  }

  async requestPasswordReset(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return;

    const resetToken = generateResetToken();
    await this.userRepository.saveResetToken(user.id, resetToken);

    await this.emailService.sendPasswordResetEmail(user.email, {
      userName: user.name,
      resetUrl: `${process.env.APP_URL}/reset-password?token=${resetToken}`,
      expiresIn: '1 hour',
    });
  }
}
```

### Frontend (Client Components)

```tsx
'use client';

import { useSendNotificationEmail } from '@/hooks/useEmail';

export function NotificationForm() {
  const { mutate: sendNotification, isPending } = useSendNotificationEmail();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    sendNotification({
      to: formData.get('email') as string,
      userName: formData.get('name') as string,
      title: 'Important Update',
      message: formData.get('message') as string,
      actionUrl: 'https://example.com/updates',
      actionText: 'View Update',
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="name" required />
      <textarea name="message" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Sending...' : 'Send Notification'}
      </button>
    </form>
  );
}
```

### Using Composite Hook

```tsx
'use client';

import { useEmailActions } from '@/hooks/useEmail';

export function AdminEmailPanel() {
  const {
    sendWelcome,
    sendVerification,
    testEmail,
    isLoading,
    errors,
  } = useEmailActions();

  return (
    <div>
      <button
        onClick={() => sendWelcome({
          to: 'user@example.com',
          userName: 'John Doe',
          verificationUrl: 'https://example.com/verify?token=abc',
        })}
        disabled={isLoading.welcome}
      >
        Send Welcome Email
      </button>

      <button
        onClick={() => testEmail({ to: 'admin@example.com' })}
        disabled={isLoading.test}
      >
        Test Email Config
      </button>

      {errors.welcome && <p>Error: {errors.welcome.message}</p>}
    </div>
  );
}
```

### Server Components

```tsx
import { sendNotificationEmail } from '@/hooks/useEmail';

export default async function ServerNotification() {
  // Direct server-side call
  const result = await sendNotificationEmail({
    to: 'user@example.com',
    userName: 'Jane Doe',
    title: 'Server Notification',
    message: 'This was sent from a server component.',
  });

  return (
    <div>
      {result.success ? (
        <p>Email sent successfully!</p>
      ) : (
        <p>Failed: {result.error}</p>
      )}
    </div>
  );
}
```

## Creating Custom Email Templates

### 1. Create Template Component

```tsx
// packages/emails/src/templates/CustomEmail.tsx
import * as React from 'react';
import { EmailLayout } from '../components/EmailLayout';
import { EmailHeader } from '../components/EmailHeader';
import { EmailFooter } from '../components/EmailFooter';
import { Button } from '../components/Button';
import { Section, Text } from '@react-email/components';

export interface CustomEmailProps {
  userName: string;
  customField: string;
  actionUrl?: string;
}

export function CustomEmail({ userName, customField, actionUrl }: CustomEmailProps) {
  return (
    <EmailLayout preview={`Custom email for ${userName}`}>
      <EmailHeader title="Custom Template" subtitle="Your custom message" />

      <Section className="mb-6">
        <Text className="mb-4 text-base text-gray-700">
          Hi {userName},
        </Text>
        <Text className="mb-4 text-base text-gray-700">
          {customField}
        </Text>
      </Section>

      {actionUrl && (
        <Section className="my-6 text-center">
          <Button href={actionUrl}>Take Action</Button>
        </Section>
      )}

      <EmailFooter />
    </EmailLayout>
  );
}
```

### 2. Export from Package

```typescript
// packages/emails/src/index.ts
export { CustomEmail, type CustomEmailProps } from './templates/CustomEmail';
```

### 3. Add Preview

```tsx
// packages/emails/emails/custom.tsx
import { CustomEmail } from '../src/templates/CustomEmail';

export default function CustomEmailPreview() {
  return (
    <CustomEmail
      userName="Test User"
      customField="This is a custom message"
      actionUrl="https://example.com/action"
    />
  );
}
```

### 4. Add Service Method

```typescript
// apps/api/src/modules/email/services/email.service.ts
async sendCustomEmail(
  to: string,
  props: CustomEmailProps,
): Promise<SendEmailResult> {
  const component = React.createElement(CustomEmail, props);
  const html = await renderEmail(component);
  const text = await renderEmailText(component);

  return this.sendEmail({
    to,
    subject: 'Custom Email Subject',
    html,
    text,
    tags: [{ name: 'category', value: 'custom' }],
  });
}
```

### 5. Create ORPC Contract

```typescript
// packages/contracts/api/modules/email/send-custom.ts
import { oc } from '@orpc/contract';
import { z } from 'zod';

export const sendCustomContract = oc
  .route({
    method: 'POST',
    path: '/custom',
    summary: 'Send custom email',
  })
  .input(
    z.object({
      to: z.string().email(),
      userName: z.string(),
      customField: z.string(),
      actionUrl: z.string().url().optional(),
    }),
  )
  .output(
    z.object({
      id: z.string(),
      success: z.boolean(),
      error: z.string().optional(),
    }),
  );
```

### 6. Add Controller Method

```typescript
// apps/api/src/modules/email/controllers/email.controller.ts
@RequireRole('admin')
@Implement(emailContract.sendCustom)
sendCustom() {
  return implement(emailContract.sendCustom).handler(async ({ input }) => {
    const result = await this.emailService.sendCustomEmail(input.to, {
      userName: input.userName,
      customField: input.customField,
      actionUrl: input.actionUrl,
    });

    return this.emailAdapter.toEmailResultContract(result);
  });
}
```

### 7. Add Frontend Hook

```typescript
// apps/web/src/hooks/useEmail.ts
export function useSendCustomEmail() {
  return useMutation(
    orpc.email.sendCustom.mutationOptions({
      onSuccess: (result) => {
        if (result.success) {
          toast.success('Custom email sent successfully');
        }
      },
      onError: (error: Error) => {
        toast.error(`Failed to send custom email: ${error.message}`);
      },
    })
  );
}
```

## Development Mode

In development mode (when `RESEND_API_KEY` is not configured), emails are **mocked** instead of sent:

```typescript
// EmailService logs instead of sending
this.logger.log(`[MOCK] Email would be sent to: ${options.to}`);
this.logger.log(`[MOCK] Subject: ${options.subject}`);
```

This allows:
- Development without Resend account
- Testing email logic locally
- Preview templates via React Email dev server
- CI/CD without API keys

## Testing

### Test Email Configuration

```bash
# Via API endpoint
curl -X POST http://localhost:3001/email/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${DEV_AUTH_KEY}" \
  -d '{"to":"your-email@example.com"}'
```

### Preview Templates

```bash
# Start React Email dev server
bun run @repo/emails -- dev

# Open browser
open http://localhost:3002
```

## Best Practices

### ✅ DO

1. **Use templates for all emails** - Never send raw HTML strings
2. **Test templates in dev server** - Preview before deploying
3. **Keep templates simple** - Email clients have limited CSS support
4. **Use inline styles** - React Email handles this automatically
5. **Add alt text to images** - For accessibility
6. **Include plain text version** - Automatically generated
7. **Batch bulk emails** - Use `sendBulkEmails()` with batching
8. **Log email failures** - Monitor via NestJS logger
9. **Use development mode** - Test without API keys locally
10. **Follow ORPC patterns** - Use custom hooks, not direct ORPC calls

### ❌ DON'T

1. **Don't send emails without templates** - Maintain consistency
2. **Don't use complex CSS** - May not render in all clients
3. **Don't send to unverified domains** - Configure Resend first
4. **Don't expose API keys** - Use environment variables only
5. **Don't send bulk emails synchronously** - Use batching
6. **Don't skip error handling** - Always handle send failures
7. **Don't hardcode email content** - Use templates with props
8. **Don't use direct ORPC in components** - Use custom hooks
9. **Don't skip authentication** - All endpoints require admin role
10. **Don't forget to test** - Use test endpoint before production

## Troubleshooting

### Email Not Sending

1. **Check Resend API Key**: Verify `RESEND_API_KEY` is configured
2. **Check Domain Verification**: Ensure sender domain is verified in Resend
3. **Check Logs**: Look for error messages in API logs
4. **Test Email Endpoint**: Use `/email/test` to verify configuration

### Template Not Rendering

1. **Check TypeScript Errors**: Run `bun run @repo/emails -- build`
2. **Preview in Dev Server**: Use `bun run @repo/emails -- dev`
3. **Check Props**: Ensure all required props are passed
4. **Check Imports**: Verify all components are imported correctly

### Rate Limits

Resend has rate limits on free tier:
- **100 emails/day** (free tier)
- **3,000 emails/month** (free tier)

Use `sendBulkEmails()` with batching for large campaigns.

## Security Considerations

1. **Admin-Only Endpoints**: All email endpoints require `@RequireRole('admin')`
2. **API Key Security**: Never expose `RESEND_API_KEY` in frontend code
3. **Email Validation**: All email addresses validated via Zod schemas
4. **Rate Limiting**: Implement rate limiting for email endpoints
5. **Content Sanitization**: Sanitize user-provided content before rendering

## Integration with Better Auth

To integrate with Better Auth for automatic email sending:

```typescript
// apps/api/src/config/auth/auth.ts
import { EmailService } from '@/modules/email/services/email.service';

export function createBetterAuth(db, env, emailService: EmailService) {
  return betterAuth({
    // ... other config
    emailAndPassword: {
      enabled: true,
      sendVerificationEmail: async ({ user, url }) => {
        await emailService.sendEmailVerification(user.email, {
          userName: user.name,
          verificationUrl: url,
        });
      },
    },
  });
}
```

## Related Documentation

- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email/docs)
- [ORPC Implementation Pattern](../core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md)
- [ORPC Client Hooks Pattern](../core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md)
- [Service-Adapter Pattern](../core-concepts/02-SERVICE-ADAPTER-PATTERN.md)

## API Reference

### EmailService Methods

```typescript
class EmailService {
  // Send generic email
  sendEmail(options: SendEmailOptions): Promise<SendEmailResult>

  // Template methods
  sendWelcomeEmail(to: string, props: WelcomeEmailProps): Promise<SendEmailResult>
  sendEmailVerification(to: string, props: EmailVerificationProps): Promise<SendEmailResult>
  sendPasswordResetEmail(to: string, props: PasswordResetEmailProps): Promise<SendEmailResult>
  sendNotificationEmail(to: string, props: NotificationEmailProps): Promise<SendEmailResult>

  // Bulk sending
  sendBulkEmails(recipients: string[], subject: string, html: string): Promise<SendEmailResult[]>

  // Testing
  testEmail(to: string): Promise<SendEmailResult>
}
```

### Frontend Hook API

```typescript
// Mutation hooks
useSendWelcomeEmail(): UseMutationResult<EmailResult>
useSendVerificationEmail(): UseMutationResult<EmailResult>
useSendPasswordResetEmail(): UseMutationResult<EmailResult>
useSendNotificationEmail(): UseMutationResult<EmailResult>
useTestEmail(): UseMutationResult<EmailResult>

// Composite hook
useEmailActions(): EmailActions

// Server functions
sendWelcomeEmail(params): Promise<EmailResult>
sendVerificationEmail(params): Promise<EmailResult>
sendPasswordResetEmail(params): Promise<EmailResult>
sendNotificationEmail(params): Promise<EmailResult>
testEmail(params): Promise<EmailResult>
```

## Support

For issues or questions:
1. Check [Resend documentation](https://resend.com/docs)
2. Check [React Email documentation](https://react.email/docs)
3. Review project core concepts documentation
4. Open an issue in the repository
