import { PasswordResetEmail } from '../src/templates/PasswordResetEmail';

export default function PasswordResetPreview() {
  return (
    <PasswordResetEmail
      userName="Alice Johnson"
      resetUrl="https://example.com/reset-password?token=reset123"
      expiresIn="1 hour"
    />
  );
}
