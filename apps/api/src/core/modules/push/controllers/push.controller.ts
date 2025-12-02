import { Controller } from "@nestjs/common";
import { Implement, implement } from "@orpc/nest";
import { pushContract } from "@repo/api-contracts";
import { PushService } from "../services/push.service";
import { Session as SessionDecorator } from "../../auth/decorators/decorators";
import type { Session } from "@repo/auth";

@Controller()
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Implement(pushContract.getPublicKey)
  getPublicKey(@SessionDecorator() session: Session) {
    return implement(pushContract.getPublicKey).handler(async () => {
      const userId = session.user.id

      const publicKey = await this.pushService.getUserPublicKey(userId);

      return {
        publicKey,
      };
    });
  }

  @Implement(pushContract.subscribe)
  subscribe(@SessionDecorator() session: Session) {
    return implement(pushContract.subscribe).handler(async ({ input }) => {
      const userId = session.user.id;
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
  unsubscribe(@SessionDecorator() session: Session) {
    return implement(pushContract.unsubscribe).handler(async ({ input }) => {
      const userId = session.user.id;
      const success = await this.pushService.unsubscribe(userId, input.endpoint);

      return {
        success,
      };
    });
  }

  @Implement(pushContract.getSubscriptions)
  getSubscriptions(@SessionDecorator() session: Session) {
    return implement(pushContract.getSubscriptions).handler(async () => {
      const userId = session.user.id;
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
  sendTestNotification(@SessionDecorator() session: Session) {
    return implement(pushContract.sendTestNotification).handler(async () => {
      const userId = session.user.id;
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
  getStats(@SessionDecorator() session: Session) {
    return implement(pushContract.getStats).handler(async () => {
      const userId = session.user.id;
      const stats = await this.pushService.getUserStats(userId);

      return {
        totalSubscriptions: stats.totalSubscriptions,
        activeSubscriptions: stats.activeSubscriptions,
        devices: stats.devices,
      };
    });
  }
}
