import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { pushContract } from "@repo/api-contracts";
import { PushService } from "../services/push.service";
import { requireAuth } from "../../orpc-auth";

@Controller()
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Implement(pushContract.getPublicKey)
  getPublicKey() {
    return implement(pushContract.getPublicKey)
      .use(requireAuth())
      .handler(async ({ context }) => {
        // requireAuth middleware guarantees user is authenticated
        const userId = context.auth.user!.id;

        const publicKey = await this.pushService.getUserPublicKey(userId);

        return {
          publicKey,
        };
      });
  }

  @Implement(pushContract.subscribe)
  subscribe() {
    return implement(pushContract.subscribe)
      .use(requireAuth())
      .handler(async ({ input, context }) => {
        // requireAuth middleware guarantees user is authenticated
        const userId = context.auth.user!.id;
        const subscription = await this.pushService.subscribe(userId, {
          endpoint: input.endpoint,
          keys: input.keys,
          deviceName: input.deviceName,
          userAgent: input.userAgent,
        });

        return {
          id: subscription.id,
          deviceName: subscription.deviceName,
          createdAt: subscription.createdAt ?? new Date(),
        };
      });
  }

  @Implement(pushContract.unsubscribe)
  unsubscribe() {
    return implement(pushContract.unsubscribe)
      .use(requireAuth())
      .handler(async ({ input, context }) => {
        // requireAuth middleware guarantees user is authenticated
        const userId = context.auth.user!.id;
        const success = await this.pushService.unsubscribe(userId, input.endpoint);

        return {
          success,
        };
      });
  }

  @Implement(pushContract.getSubscriptions)
  getSubscriptions() {
    return implement(pushContract.getSubscriptions)
      .use(requireAuth())
      .handler(async ({ context }) => {
        // requireAuth middleware guarantees user is authenticated
        const userId = context.auth.user!.id;
        const subscriptions = await this.pushService.getUserSubscriptions(userId);

        return {
          subscriptions: subscriptions.map((sub) => ({
            id: sub.id,
            endpoint: sub.endpoint,
            deviceName: sub.deviceName,
            userAgent: sub.userAgent,
            isActive: sub.isActive ?? true,
            createdAt: sub.createdAt ?? new Date(),
            lastUsedAt: sub.lastUsedAt,
          })),
        };
      });
  }

  @Implement(pushContract.sendTestNotification)
  sendTestNotification() {
    return implement(pushContract.sendTestNotification)
      .use(requireAuth())
      .handler(async ({ context }) => {
        // requireAuth middleware guarantees user is authenticated
        const userId = context.auth.user!.id;
        const result = await this.pushService.sendToUser(userId, {
          title: "Test Notification",
          body: "This is a test notification from your app!",
          icon: "/icon.png",
          data: { type: "test", timestamp: new Date().toISOString() },
        });

        return {
          success: result.success,
          failed: result.failed,
          total: result.total,
        };
      });
  }

  @Implement(pushContract.getStats)
  getStats() {
    return implement(pushContract.getStats)
      .use(requireAuth())
      .handler(async ({ context }) => {
        // requireAuth middleware guarantees user is authenticated
        const userId = context.auth.user!.id;
        const stats = await this.pushService.getUserStats(userId);

        return {
          totalSubscriptions: stats.totalSubscriptions,
          activeSubscriptions: stats.activeSubscriptions,
          devices: stats.devices,
        };
      });
  }
}
