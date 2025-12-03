import { oc } from "@orpc/contract";
import { notificationStreamContract } from "./stream";
import { notificationPublishContract } from "./publish";

/**
 * Notifications contract router
 * 
 * Provides real-time notification streaming and publishing capabilities
 */
export const notificationContract = oc
  .tag("Notifications")
  .prefix("/notifications")
  .router({
    stream: notificationStreamContract,
    publish: notificationPublishContract,
  });

export type NotificationContract = typeof notificationContract;

// Re-export all contracts and schemas
export * from "./stream";
export * from "./publish";
export * from "./schemas";
