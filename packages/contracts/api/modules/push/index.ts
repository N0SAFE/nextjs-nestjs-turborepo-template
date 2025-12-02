import { oc } from "@orpc/contract";
import { subscribeContract } from './subscribe';
import { unsubscribeContract } from './unsubscribe';
import { getPublicKeyContract } from './getPublicKey';
import { getSubscriptionsContract } from './getSubscriptions';
import { sendTestNotificationContract } from './sendTestNotification';
import { getStatsContract } from './getStats';

export const pushContract = oc.tag("Push Notifications").prefix("/push").router({
  subscribe: subscribeContract,
  unsubscribe: unsubscribeContract,
  getPublicKey: getPublicKeyContract,
  getSubscriptions: getSubscriptionsContract,
  sendTestNotification: sendTestNotificationContract,
  getStats: getStatsContract,
});

export type PushContract = typeof pushContract;

export * from './subscribe';
export * from './unsubscribe';
export * from './getPublicKey';
export * from './getSubscriptions';
export * from './sendTestNotification';
export * from './getStats';
