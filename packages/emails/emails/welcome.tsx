import { WelcomeEmail } from '../src/templates/WelcomeEmail';

export default function WelcomeEmailPreview() {
  return (
    <WelcomeEmail
      userName="John Doe"
      verificationUrl="https://example.com/verify?token=abc123"
    />
  );
}
