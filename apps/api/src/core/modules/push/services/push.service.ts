import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PushRepository, type PushSubscriptionEntity, type UserVapidKeysEntity } from "../repositories/push.repository";
import * as webpush from "web-push";

export interface SubscribeInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceName?: string;
  userAgent?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
  tag?: string;
  url?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly pushRepository: PushRepository) {}

  /**
   * Generate and store VAPID keys for a user
   */
  async generateUserVapidKeys(userId: string): Promise<UserVapidKeysEntity> {
    // Check if user already has keys
    const existingKeys = await this.pushRepository.findVapidKeysByUserId(userId);
    if (existingKeys) {
      this.logger.warn(`User ${userId} already has VAPID keys`);
      return existingKeys;
    }

    const vapidKeys = webpush.generateVAPIDKeys();

    const userVapidKeys = await this.pushRepository.createVapidKeys(
      userId,
      vapidKeys.publicKey,
      vapidKeys.privateKey,
      `mailto:user-${userId}@notifications.local`
    );

    this.logger.log(`Generated VAPID keys for user ${userId}`);

    return userVapidKeys;
  }

  /**
   * Get user's public VAPID key
   */
  async getUserPublicKey(userId: string): Promise<string> {
    let userKeys = await this.pushRepository.findVapidKeysByUserId(userId);

    // Auto-generate keys if they don't exist
    userKeys ??= await this.generateUserVapidKeys(userId);

    return userKeys.publicKey;
  }

  /**
   * Subscribe a user to push notifications
   */
  async subscribe(userId: string, input: SubscribeInput): Promise<PushSubscriptionEntity> {
    // Ensure user has VAPID keys
    await this.getUserPublicKey(userId);

    // Check if subscription already exists
    const existingSubscription = await this.pushRepository.findSubscriptionByEndpoint(input.endpoint);

    if (existingSubscription) {
      // Update existing subscription
      return await this.pushRepository.updateSubscription(
        input.endpoint,
        userId,
        input.keys.p256dh,
        input.keys.auth,
        input.deviceName,
        input.userAgent
      );
    } else {
      // Create new subscription
      return await this.pushRepository.createSubscription(
        userId,
        input.endpoint,
        input.keys.p256dh,
        input.keys.auth,
        input.deviceName,
        input.userAgent
      );
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string, endpoint: string): Promise<boolean> {
    const subscription = await this.pushRepository.findSubscriptionByEndpoint(endpoint);

    if (subscription?.userId !== userId) {
      throw new NotFoundException("Subscription not found");
    }

    return await this.pushRepository.deleteSubscription(userId, endpoint);
  }

  /**
   * Get all active subscriptions for a user
   */
  async getUserSubscriptions(userId: string): Promise<PushSubscriptionEntity[]> {
    return await this.pushRepository.findActiveSubscriptionsByUserId(userId);
  }

  /**
   * Send notification to a specific user (all their devices)
   */
  async sendToUser(
    userId: string,
    payload: NotificationPayload
  ): Promise<{
    success: number;
    failed: number;
    total: number;
  }> {
    // Get user's VAPID keys
    const userKeys = await this.pushRepository.findVapidKeysByUserId(userId);
    if (!userKeys) {
      throw new NotFoundException(`VAPID keys not found for user ${userId}`);
    }

    // Get all active subscriptions for the user
    const subscriptions = await this.getUserSubscriptions(userId);
    if (subscriptions.length === 0) {
      this.logger.warn(`No active subscriptions found for user ${userId}`);
      return { success: 0, failed: 0, total: 0 };
    }

    // Send to all user's devices
    const results = await Promise.allSettled(
      subscriptions.map((sub) => this.sendNotificationToSubscription(sub, payload, userKeys))
    );

    const success = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    this.logger.log(`Sent notification to user ${userId}: ${String(success)}/${String(subscriptions.length)} successful`);

    return { success, failed, total: subscriptions.length };
  }

  /**
   * Send notification to a specific subscription
   */
  private async sendNotificationToSubscription(
    subscription: PushSubscriptionEntity,
    payload: NotificationPayload,
    userKeys: UserVapidKeysEntity
  ): Promise<void> {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      const payloadString = JSON.stringify(payload);

      // Set VAPID details for this specific user
      webpush.setVapidDetails(userKeys.subject ?? "", userKeys.publicKey, userKeys.privateKey);

      await webpush.sendNotification(pushSubscription, payloadString);

      // Update last used timestamp
      await this.pushRepository.updateSubscriptionLastUsed(subscription.id);

      this.logger.debug(`Notification sent to subscription ${subscription.id}`);
    } catch (error: any) {
      if (!(error instanceof webpush.WebPushError)) {
        throw error;
      }
      
      this.logger.error(`Error sending notification to subscription ${subscription.id}: ${error.message}`);

      // Handle expired or invalid subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        this.logger.warn(`Marking subscription ${subscription.id} as inactive`);
        await this.pushRepository.markSubscriptionInactive(subscription.id);
      }

      throw error;
    }
  }

  /**
   * Get statistics for a user
   */
  async getUserStats(userId: string): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    devices: { deviceName: string; lastUsed: Date }[];
  }> {
    const allSubscriptions = await this.pushRepository.findAllSubscriptionsByUserId(userId);
    const activeSubscriptions = allSubscriptions.filter((s) => s.isActive);

    const devices = activeSubscriptions.map((s) => ({
      deviceName: s.deviceName ?? "Unknown Device",
      lastUsed: s.lastUsedAt ?? s.createdAt ?? new Date(),
    }));

    return {
      totalSubscriptions: allSubscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      devices,
    };
  }
}
