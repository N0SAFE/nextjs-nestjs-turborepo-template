export type CoreEventStreamScope = 'global' | 'tenant' | 'user' | 'custom';

export type CoreEventStreamDefinition = {
  id: string;
  name: string;
  namespace: string;
  description: string | null;
  isActive: boolean;
  scope: CoreEventStreamScope;
  scopeId: string | null;
  filters: Record<string, unknown> | null;
  replayDefault: boolean;
  replayLimitDefault: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CoreSyncedEventEnvelope = {
  streamId: string;
  namespace: string;
  eventName: string;
  payload: unknown;
  sequence: number;
  replayed?: boolean;
  emittedAt: string;
}

export type CoreEventStreamListInput = {
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'namespace';
  sortDirection?: 'asc' | 'desc';
  filter?: Record<string, unknown>;
}