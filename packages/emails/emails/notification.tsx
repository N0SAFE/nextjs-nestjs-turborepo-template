import { NotificationEmail } from '../src/templates/NotificationEmail';

export default function NotificationPreview() {
  return (
    <NotificationEmail
      userName="Bob Wilson"
      title="New Feature Available"
      message="We've just launched an exciting new feature that we think you'll love. Check it out and let us know what you think!"
      actionUrl="https://example.com/features/new"
      actionText="Explore New Feature"
    />
  );
}
