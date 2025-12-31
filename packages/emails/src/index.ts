// Components
export { EmailLayout } from './components/EmailLayout';
export { EmailHeader } from './components/EmailHeader';
export { EmailFooter } from './components/EmailFooter';
export { Button } from './components/Button';

// Templates
export { WelcomeEmail, type WelcomeEmailProps } from './templates/WelcomeEmail';
export { EmailVerification, type EmailVerificationProps } from './templates/EmailVerification';
export { PasswordResetEmail, type PasswordResetEmailProps } from './templates/PasswordResetEmail';
export { NotificationEmail, type NotificationEmailProps } from './templates/NotificationEmail';

// Utils
export { renderEmail, renderEmailText } from './utils/render';
