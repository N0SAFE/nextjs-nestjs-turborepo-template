import { EmailVerification } from '../src/templates/EmailVerification';

export default function EmailVerificationPreview() {
  return (
    <EmailVerification
      userName="Jane Smith"
      verificationUrl="https://example.com/verify-email?token=xyz789"
      expiresIn="24 hours"
    />
  );
}
