/// <reference lib="webworker" />
import { createSerwist, addEventListeners } from 'serwist';

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: { url: string; revision: string | null }[];
};

const serwist = createSerwist({
  precache: {
    entries: self.__SW_MANIFEST,
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
});

addEventListeners(serwist);


// Auto-activate on message
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (event.data && typeof event.data === 'object' && 'type' in event.data && event.data.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});
