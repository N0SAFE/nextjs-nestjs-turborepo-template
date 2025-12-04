import type { BetterAuthPlugin } from "better-auth";

/**
 * Push Notifications Plugin Options
 */
export interface PushNotificationsPluginOptions {
  /**
   * Optional function for getting the current date (useful for testing)
   * @default () => new Date()
   */
  getDate?: () => Date;
}

/**
 * Better Auth plugin for push notifications schema management
 * 
 * This plugin defines the database schema for:
 * - User VAPID keys (for web push notifications)
 * - Push subscriptions (user device subscriptions)
 * 
 * The actual push notification logic lives in the NestJS API module,
 * but the schema is defined here to integrate with Better Auth's user system.
 * 
 * @example
 * ```typescript
 * import { pushNotificationsPlugin } from '@repo/auth/server/plugins/pushNotifications'
 * 
 * betterAuth({
 *   plugins: [
 *     pushNotificationsPlugin()
 *   ]
 * })
 * ```
 */
export const pushNotificationsPlugin = (
  options: PushNotificationsPluginOptions = {}
) => {
  const opts = {
    getDate: options.getDate ?? (() => new Date()),
  };

  return {
    id: "push-notifications",
    schema: {
      userVapidKeys: {
        fields: {
          userId: {
            type: "string",
            required: true,
            unique: true,
            references: { model: "user", field: "id", onDelete: "cascade" },
          },
          publicKey: { type: "string", required: true },
          privateKey: { type: "string", required: true },
          subject: { type: "string", required: false },
          createdAt: { type: "date", defaultValue: () => opts.getDate() },
        },
      },
      pushSubscription: {
        fields: {
          userId: {
            type: "string",
            required: true,
            references: { model: "user", field: "id", onDelete: "cascade" },
          },
          endpoint: { type: "string", required: true, unique: true },
          p256dh: { type: "string", required: true },
          auth: { type: "string", required: true },
          deviceName: { type: "string", required: false },
          userAgent: { type: "string", required: false },
          isActive: { type: "boolean", defaultValue: () => true },
          createdAt: { type: "date", defaultValue: () => opts.getDate() },
          updatedAt: {
            type: "date",
            defaultValue: () => opts.getDate(),
          },
          lastUsedAt: { type: "date", required: false },
        },
      },
    },
  } satisfies BetterAuthPlugin;
};
