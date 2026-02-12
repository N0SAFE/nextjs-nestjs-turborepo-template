/**
 * Type-safe list query builder for Drizzle ORM.
 *
 * Fluent builder that replaces boilerplate filter switches, sort switches,
 * and manual query execution in repository list methods.
 *
 * @example
 * ```typescript
 * return listBuilder(input.filter)
 *     .filter({
 *         email: ({ operator, value }) => {
 *             switch (operator) {
 *                 case "eq":   return eq(user.email, value);
 *                 case "like": return like(user.email, `%${value}%`);
 *             }
 *         },
 *     })
 *     .order(input.sortBy, input.sortDirection, {
 *         name: user.name, email: user.email, createdAt: user.createdAt,
 *     }, user.createdAt)
 *     .pagination({ limit: input.limit, offset: input.offset })
 *     .execute(db, user);
 * ```
 */
import { and, or, asc, desc, count, type AnyColumn, type SQL, type InferSelectModel } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { Database } from "@/core/modules/database/services/database.service";

/**
 * Constraint for filter objects with recursive _and/_or logical nesting.
 * Uses F-bounded polymorphism to preserve the concrete filter type through recursion.
 */
export interface FilterWithLogical {
    _and?: unknown;
    _or?: unknown;
}

/**
 * Per-field resolver map. Each key maps to a function that receives
 * the fully-typed { operator, value } discriminated union entry for that field.
 */
export type FilterResolvers<TFilter> = {
    [K in Exclude<keyof TFilter, "_and" | "_or">]?: (
        entry: NonNullable<TFilter[K]>,
    ) => SQL | undefined;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function resolveFilter<TFilter extends Record<string, unknown>>(
    filter: TFilter | undefined | null,
    resolvers: FilterResolvers<TFilter>,
    maxDepth = 10,
): SQL | undefined {
    if (!filter || maxDepth <= 0) return undefined;

    const parts: (SQL | undefined)[] = [];

    const resolverEntries = Object.entries(resolvers) as [string, (entry: never) => SQL | undefined][];
    const filterRecord = filter as Record<string, unknown>;
    for (const [key, resolver] of resolverEntries) {
        const entry = filterRecord[key];
        if (entry != null) {
            parts.push(resolver(entry as never));
        }
    }

    const logicalFilter = filter as FilterWithLogical;
    const andGroup: unknown = logicalFilter._and;
    if (Array.isArray(andGroup)) {
        const andParts = andGroup
            .map((child) => resolveFilter(child as TFilter, resolvers, maxDepth - 1))
            .filter((x): x is SQL => x !== undefined);
        if (andParts.length > 0) {
            parts.push(andParts.length === 1 ? andParts[0] : and(...andParts));
        }
    }

    const orGroup: unknown = logicalFilter._or;
    if (Array.isArray(orGroup)) {
        const orParts = orGroup
            .map((child) => resolveFilter(child as TFilter, resolvers, maxDepth - 1))
            .filter((x): x is SQL => x !== undefined);
        if (orParts.length > 0) {
            parts.push(orParts.length === 1 ? orParts[0] : or(...orParts));
        }
    }

    const defined = parts.filter((x): x is SQL => x !== undefined);
    if (defined.length === 0) return undefined;
    if (defined.length === 1) return defined[0];
    return and(...defined);
}

function resolveSort<TField extends string>(
    sortBy: TField | undefined,
    sortDirection: "asc" | "desc" | undefined,
    columns: Record<TField, AnyColumn>,
    defaultColumn: AnyColumn,
): SQL {
    const dirFn = sortDirection === "asc" ? asc : desc;
    if (!sortBy) return dirFn(defaultColumn);
    if (!(sortBy in columns)) {
        throw new Error(`Unsupported sort field: ${sortBy}`);
    }
    return dirFn(columns[sortBy]);
}

/**
 * Type-safe bypass for Drizzle's `from()` conditional type.
 *
 * `TableLikeHasEmptySelection<PgTable>` is always `false`
 * (it only checks `Subquery`), but TypeScript cannot evaluate
 * the conditional with a generic `TTable extends PgTable`.
 */
type FromParam = Parameters<ReturnType<Database["select"]>["from"]>[0];

interface DynamicCapableQuery {
    $dynamic?: () => DynamicCapableQuery;
}

interface QueryChain<TResult> extends DynamicCapableQuery, PromiseLike<TResult> {
    where(condition: SQL): QueryChain<TResult>;
    orderBy(order: SQL): QueryChain<TResult>;
    limit(limit: number): QueryChain<TResult>;
    offset(offset: number): QueryChain<TResult>;
}

function ensureDynamic<TQuery extends DynamicCapableQuery>(query: TQuery): TQuery {
    if (typeof query.$dynamic === "function") {
        return query.$dynamic() as TQuery;
    }
    return query;
}

/**
 * Pagination input types - supports offset, cursor, and page-based pagination
 */
export type PaginationInput =
    | { limit: number; offset: number; page?: never; cursor?: never }         // offset-based
    | { limit: number; page: number; pageSize?: number; offset?: never; cursor?: never }  // page-based  
    | { limit: number; cursor?: string; offset?: never; page?: never }        // cursor-based
    | { limit: number; offset: number; page: number; cursor?: never };        // combined offset+page

/**
 * Pagination metadata output - varies based on input type
 */
export type PaginationMeta<TInput extends PaginationInput> = 
    TInput extends { page: number }
        ? { total: number; limit: number; offset: number; page: number; pageSize: number; totalPages: number; hasMore: boolean }
        : TInput extends { cursor?: string }
            ? { limit: number; hasMore: boolean; nextCursor?: string | null; prevCursor?: string | null }
            : { total: number; limit: number; offset: number; hasMore: boolean };

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Create a fluent list query builder.
 *
 * Chain `.filter()`, `.order()`, `.pagination()` then `.execute(db, table)`
 * to run both data + count queries in parallel and get `{ data, meta }`.
 */
export function listBuilder<TFilter extends Record<string, unknown>>(
    filterData: TFilter | undefined | null,
) {
    let _where: SQL | undefined;
    let _orderBy: SQL | undefined;
    let _pagination: PaginationInput | undefined;

    const self = {
        /**
         * Resolve filter fields via per-field resolver map.
         * Supports recursive _and/_or nesting automatically.
         */
        filter(resolvers: FilterResolvers<TFilter>) {
            _where = resolveFilter(filterData, resolvers);
            return self;
        },

        /**
         * Set ORDER BY from sortBy/sortDirection + column map.
         */
        order<TField extends string>(
            sortBy: TField | undefined,
            sortDirection: "asc" | "desc" | undefined,
            columns: Record<TField, AnyColumn>,
            defaultColumn: AnyColumn,
        ) {
            _orderBy = resolveSort(sortBy, sortDirection, columns, defaultColumn);
            return self;
        },

        /**
         * Set pagination - supports offset, page, or cursor-based pagination.
         * The input type determines the metadata format returned by execute().
         */
        pagination<TInput extends PaginationInput>(config: TInput) {
            _pagination = config;
            return self as Omit<typeof self, "execute"> & {
                execute<TTable extends PgTable>(
                    db: Database,
                    table: TTable,
                ): Promise<{
                    data: InferSelectModel<TTable>[];
                    meta: PaginationMeta<TInput>;
                }>;
            };
        },

        /**
         * Execute both data + count queries in parallel.
         * Returns `{ data, meta }` where meta format depends on pagination type.
         */
        async execute<TTable extends PgTable>(
            db: Database,
            table: TTable,
        ): Promise<{
            data: InferSelectModel<TTable>[];
            meta: PaginationMeta<PaginationInput>;
        }> {
            if (!_pagination) {
                throw new Error("pagination() must be called before execute()");
            }

            const from = table as unknown as FromParam;

            // Calculate limit and offset based on pagination type
            let limit: number;
            let offset: number;
            let cursorValue: string | undefined;
            const input = _pagination;

            if ("cursor" in input && input.cursor !== undefined) {
                // Cursor-based pagination
                limit = input.limit;
                cursorValue = input.cursor;
                // Decode cursor to get offset (simple base64 offset encoding)
                try {
                    offset = parseInt(Buffer.from(cursorValue, "base64").toString("utf-8"), 10);
                    if (isNaN(offset) || offset < 0) offset = 0;
                } catch {
                    offset = 0;
                }
            } else if ("page" in input && input.page !== undefined) {
                // Page-based pagination
                const pageSize = ("pageSize" in input && input.pageSize) ? input.pageSize : input.limit;
                limit = pageSize;
                offset = (input.page - 1) * pageSize;
            } else {
                // Offset-based pagination (default)
                limit = input.limit;
                offset = ("offset" in input && input.offset) ? input.offset : 0;
            }

            // Build queries
            let dataQ = ensureDynamic(db.select().from(from) as unknown as QueryChain<InferSelectModel<TTable>[]>);
            let countQ = ensureDynamic(db.select({ count: count() }).from(from) as unknown as QueryChain<{ count: number }[]>);

            if (_where) {
                dataQ = dataQ.where(_where);
                countQ = countQ.where(_where);
            }

            if (_orderBy) {
                dataQ = dataQ.orderBy(_orderBy);
            }

            dataQ = dataQ.limit(limit).offset(offset);

            // Execute queries
            const isCursorBased = "cursor" in _pagination && _pagination.cursor !== undefined;
            const [data, totalResult] = await Promise.all([
                dataQ,
                isCursorBased ? Promise.resolve([{ count: 0 }]) : countQ, // Skip count for cursor-based
            ]);

            const total = totalResult[0]?.count ?? 0;
            const hasMore = data.length === limit;

            // Build metadata based on pagination type
            if ("cursor" in _pagination) {
                // Cursor-based pagination metadata
                const nextOffset = offset + limit;
                const prevOffset = Math.max(0, offset - limit);

                return {
                    data: data as InferSelectModel<TTable>[],
                    meta: {
                        limit,
                        hasMore,
                        nextCursor: hasMore ? Buffer.from(nextOffset.toString()).toString("base64") : null,
                        prevCursor: offset > 0 ? Buffer.from(prevOffset.toString()).toString("base64") : null,
                    } as PaginationMeta<typeof _pagination>,
                };
            } else if ("page" in _pagination && _pagination.page !== undefined) {
                // Page-based pagination metadata
                const input = _pagination;
                const pageSize = ("pageSize" in input && input.pageSize) ? input.pageSize : input.limit;
                const page = input.page;
                const totalPages = Math.ceil(total / pageSize);

                return {
                    data: data as InferSelectModel<TTable>[],
                    meta: {
                        total,
                        limit,
                        offset,
                        page,
                        pageSize,
                        totalPages,
                        hasMore: page < totalPages,
                    } as PaginationMeta<typeof _pagination>,
                };
            } else {
                // Offset-based pagination metadata
                return {
                    data: data as InferSelectModel<TTable>[],
                    meta: {
                        total,
                        limit,
                        offset,
                        hasMore: offset + limit < total,
                    } as PaginationMeta<typeof _pagination>,
                };
            }
        },
    };

    return self;
}
