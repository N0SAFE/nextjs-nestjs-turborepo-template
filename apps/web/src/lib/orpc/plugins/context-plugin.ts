// ============================================
// Type Definitions
// ============================================

import { StandardLinkOptions, StandardLinkPlugin } from "@orpc/client/standard";

export class ContextPlugin<
  T extends {
    cache?: RequestCache;
    next?: NextFetchRequestConfig;
  },
> implements StandardLinkPlugin<T>
{
  // Order controls plugin loading order (higher = loads earlier)
  order = 100;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  init(link: StandardLinkOptions<T>): void {}
}

const contextPluginDefault = {
  ContextPlugin,
};

export default contextPluginDefault;
