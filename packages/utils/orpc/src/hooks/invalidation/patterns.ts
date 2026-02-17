/**
 * Predefined invalidation patterns for common scenarios.
 */
export const commonPatterns = {
  /** Standard CRUD pattern. */
  crud: (listName = 'list', findByIdName = 'findById', countName = 'count') => ({
    create: {
      invalidate: [listName, countName],
      strategy: 'optimistic' as const,
    },
    update: {
      invalidate: [listName, findByIdName],
      strategy: 'optimistic' as const,
    },
    delete: {
      invalidate: [listName, countName, findByIdName],
      strategy: 'pessimistic' as const,
    },
  }),

  /** Pattern for hierarchical data (parent/child relationships). */
  hierarchical: (parentList: string, childList: string) => ({
    createChild: {
      invalidate: [childList, parentList],
      strategy: 'optimistic' as const,
    },
    updateChild: {
      invalidate: [childList],
      strategy: 'optimistic' as const,
    },
    deleteChild: {
      invalidate: [childList, parentList],
      strategy: 'pessimistic' as const,
    },
  }),

  /** Pattern for search/filter operations. */
  searchable: (searchName: string, listName: string) => ({
    updateSearchResults: {
      invalidate: [searchName],
      refetch: [listName],
      strategy: 'hybrid' as const,
    },
  }),
};
