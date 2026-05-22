import type {
  CoreEventStreamDefinition,
  CoreEventStreamListInput,
} from './core-event-stream.types';

export type CoreEventStreamRepositoryPort = {
  findMany(input: CoreEventStreamListInput): Promise<{
    data: CoreEventStreamDefinition[];
    meta: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>;

  findById(id: string): Promise<CoreEventStreamDefinition | null>;
};