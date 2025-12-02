import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/services/database.service";
import { pushSubscription, userVapidKeys } from "@/config/drizzle/schema/auth";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { InferSelectModel } from "drizzle-orm";

export type PushSubscriptionEntity = InferSelectModel<typeof pushSubscription>;
export type UserVapidKeysEntity = InferSelectModel<typeof userVapidKeys>;

@Injectable()
export class PushRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Find VAPID keys for a user
   */
  async findVapidKeysByUserId(userId: string): Promise<UserVapidKeysEntity | null> {
    const result = await this.databaseService.db
      .select()
      .from(userVapidKeys)
      .where(eq(userVapidKeys.userId, userId))
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Create VAPID keys for a user
   */
  async createVapidKeys(
    userId: string,
    publicKey: string,
    privateKey: string,
    subject: string
  ): Promise<UserVapidKeysEntity> {
    const result = await this.databaseService.db
      .insert(userVapidKeys)
      .values({
        id: randomUUID(),
        userId,
        publicKey,
        privateKey,
        subject,
        createdAt: new Date(),
      })
      .returning();

    return result[0]!;
  }

  /**
   * Find subscription by endpoint
   */
  async findSubscriptionByEndpoint(endpoint: string): Promise<PushSubscriptionEntity | null> {
    const result = await this.databaseService.db
      .select()
      .from(pushSubscription)
      .where(eq(pushSubscription.endpoint, endpoint))
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Find all active subscriptions for a user
   */
  async findActiveSubscriptionsByUserId(userId: string): Promise<PushSubscriptionEntity[]> {
    return await this.databaseService.db
      .select()
      .from(pushSubscription)
      .where(and(eq(pushSubscription.userId, userId), eq(pushSubscription.isActive, true)));
  }

  /**
   * Find all subscriptions for a user
   */
  async findAllSubscriptionsByUserId(userId: string): Promise<PushSubscriptionEntity[]> {
    return await this.databaseService.db
      .select()
      .from(pushSubscription)
      .where(eq(pushSubscription.userId, userId));
  }

  /**
   * Create a new push subscription
   */
  async createSubscription(
    userId: string,
    endpoint: string,
    p256dh: string,
    auth: string,
    deviceName?: string,
    userAgent?: string
  ): Promise<PushSubscriptionEntity> {
    const now = new Date();
    const result = await this.databaseService.db
      .insert(pushSubscription)
      .values({
        id: randomUUID(),
        userId,
        endpoint,
        p256dh,
        auth,
        deviceName: deviceName ?? null,
        userAgent: userAgent ?? null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        lastUsedAt: now,
      })
      .returning();

    return result[0]!;
  }

  /**
   * Update an existing push subscription
   */
  async updateSubscription(
    endpoint: string,
    userId: string,
    p256dh: string,
    auth: string,
    deviceName?: string,
    userAgent?: string
  ): Promise<PushSubscriptionEntity> {
    const now = new Date();
    const result = await this.databaseService.db
      .update(pushSubscription)
      .set({
        userId,
        p256dh,
        auth,
        deviceName: deviceName ?? null,
        userAgent: userAgent ?? null,
        isActive: true,
        updatedAt: now,
        lastUsedAt: now,
      })
      .where(eq(pushSubscription.endpoint, endpoint))
      .returning();

    return result[0]!;
  }

  /**
   * Update last used timestamp for a subscription
   */
  async updateSubscriptionLastUsed(id: string): Promise<void> {
    await this.databaseService.db
      .update(pushSubscription)
      .set({
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pushSubscription.id, id));
  }

  /**
   * Mark subscription as inactive
   */
  async markSubscriptionInactive(id: string): Promise<void> {
    await this.databaseService.db
      .update(pushSubscription)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(pushSubscription.id, id));
  }

  /**
   * Delete a subscription
   */
  async deleteSubscription(userId: string, endpoint: string): Promise<boolean> {
    const result = await this.databaseService.db
      .delete(pushSubscription)
      .where(and(eq(pushSubscription.userId, userId), eq(pushSubscription.endpoint, endpoint)))
      .returning();

    return result.length > 0;
  }
}
