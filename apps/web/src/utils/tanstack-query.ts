/* eslint react-hooks/rules-of-hooks: 0 */

import {
    DefaultError,
    DefinedInitialDataInfiniteOptions,
    DefinedInitialDataOptions,
    DefinedUseInfiniteQueryResult,
    DefinedUseQueryResult,
    InfiniteData,
    QueryClient,
    QueryFunctionContext,
    QueryKey,
    UndefinedInitialDataInfiniteOptions,
    UndefinedInitialDataOptions,
    useInfiniteQuery,
    UseInfiniteQueryOptions,
    UseInfiniteQueryResult,
    useMutation,
    UseMutationOptions,
    useQuery,
    UseQueryOptions,
    UseQueryResult,
} from '@tanstack/react-query'
import { ArrayContains, UnionToArray } from '@repo/types/utils'

export type FunctionContext<
    TParams = QueryKey,
    TPageParam = unknown,
    TQueryKey extends QueryKey = QueryKey,
> = QueryFunctionContext<TQueryKey, TPageParam> & { params: TParams }

export function transformUseParams<
    TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TParams extends QueryKey = QueryKey,
    TNewParams extends QueryKey = QueryKey,
    TPageParam = unknown,
>(
    toFunc: (
        func: (
            ctx: FunctionContext<TNewParams, TPageParam, TQueryKey>
        ) => TQueryFnData | Promise<TQueryFnData>
    ) => unknown,
    func: (
        ctx: FunctionContext<TParams, TPageParam, TQueryKey>
    ) => TQueryFnData | Promise<TQueryFnData>,
    transformFunc: (...params: TNewParams) => TParams
) {
    return toFunc(function ({
        params,
        ...ctx
    }: FunctionContext<TNewParams, TPageParam, TQueryKey>) {
        return func({
            ...ctx,
            params: transformFunc(...params),
        } as FunctionContext<TParams, TPageParam, TQueryKey>)
    })
}

export function transformUseReturn<
    TQueryFnData,
    TNewQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TParams extends QueryKey = QueryKey,
    TPageParam = unknown,
>(
    toFunc: (
        func: (
            ctx: FunctionContext<TParams, TPageParam, TQueryKey>
        ) => TNewQueryFnData | Promise<TNewQueryFnData>
    ) => unknown,
    func: (
        ctx: FunctionContext<TParams, TPageParam, TQueryKey>
    ) => TQueryFnData | Promise<TQueryFnData>,
    transformFunc: (data: TQueryFnData) => TNewQueryFnData,
    addToQueryKey: boolean = true
) {
    return toFunc(function ({
        queryKey: _queryKey,
        ...ctx
    }: FunctionContext<TParams, TPageParam, TQueryKey>) {
        const data = func(
            (addToQueryKey
                ? {
                      ...ctx,
                      queryKey: [
                          ..._queryKey,
                          atob?.('transformUseReturn') ||
                              'transformUseReturn' /** create a unique hash for this specific function */,
                      ],
                  }
                : {
                      ...ctx,
                      queryKey: _queryKey,
                  }) as unknown as FunctionContext<
                TParams,
                TPageParam,
                TQueryKey
            >
        )
        if (data instanceof Promise) {
            return data.then(transformFunc) as Promise<TNewQueryFnData>
        } else {
            return transformFunc(data) as TNewQueryFnData
        }
    })
}

export function addUseQueryKey<
    TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TParams extends QueryKey = QueryKey,
    TPageParam = unknown,
>(
    toFunc: (
        func: (
            ctx: FunctionContext<TParams, TPageParam, TQueryKey>
        ) => TQueryFnData | Promise<TQueryFnData>
    ) => unknown,
    func: (
        ctx: FunctionContext<TParams, TPageParam, TQueryKey>
    ) => TQueryFnData | Promise<TQueryFnData>,
    queryKey: QueryKey
) {
    return toFunc(function ({
        queryKey: _queryKey,
        ...ctx
    }: FunctionContext<TParams, TPageParam, TQueryKey>) {
        return func({
            queryKey: [...(_queryKey ?? []), ...queryKey],
            ...ctx,
        } as unknown as FunctionContext<TParams, TPageParam, TQueryKey>)
    })
}

export function toAdvancedUseQuery<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TParams extends QueryKey = QueryKey,
    TPageParam = unknown,
>(
    func: (
        ctx: FunctionContext<TParams, TPageParam, TQueryKey>
    ) => TQueryFnData | Promise<TQueryFnData>
) {
    function use<
        Options extends Omit<
            | (DefinedInitialDataOptions<
                  TQueryFnData,
                  TError,
                  TData,
                  TQueryKey
              > &
                  (ArrayContains<
                      UnionToArray<TParams['length']>,
                      0
                  > extends true // this check if the params can be optional because it require no arguments
                      ? { params?: TParams }
                      : { params: TParams }))
            | (UndefinedInitialDataOptions<
                  TQueryFnData,
                  TError,
                  TData,
                  TQueryKey
              > &
                  (ArrayContains<
                      UnionToArray<TParams['length']>,
                      0
                  > extends true // this check if the params can be optional because it require no arguments
                      ? { params?: TParams }
                      : { params: TParams }))
            | (UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & // this check if the params can be optional because it require no arguments
                  (ArrayContains<
                      UnionToArray<TParams['length']>,
                      0
                  > extends true
                      ? { params?: TParams }
                      : { params: TParams })),
            'queryKey'
        > & { queryKey?: TQueryKey } = Omit<
            UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & // this check if the params can be optional because it require no arguments
                (ArrayContains<UnionToArray<TParams['length']>, 0> extends true
                    ? { params?: TParams }
                    : { params: TParams }),
            'queryKey'
        > & { queryKey?: TQueryKey },
    >(options: Options, queryClient?: QueryClient) {
        return useQuery<TQueryFnData, TError, TData, TQueryKey>(
            {
                ...options,
                queryFn: (ctx) =>
                    func({
                        ...ctx,
                        params: options.params || [],
                    } as FunctionContext<TParams, TPageParam, TQueryKey>),
                queryKey: [
                    ...(options.queryKey ?? []),
                    ...(options.params ?? []),
                ],
            },
            queryClient
        ) as Options extends DefinedInitialDataOptions<
            TQueryFnData,
            TError,
            TData,
            TQueryKey
        >
            ? DefinedUseQueryResult<TData, TError>
            : UseQueryResult<TData, TError>
    }

    function transformParams<TNewParams extends QueryKey>(
        funcTransformParams: (...params: TNewParams) => TParams
    ): ReturnType<
        typeof toAdvancedUseQuery<
            TQueryFnData,
            TError,
            TData,
            TQueryKey,
            TNewParams,
            TPageParam
        >
    > {
        return transformUseParams(
            toAdvancedUseQuery,
            func,
            funcTransformParams
        ) as ReturnType<
            typeof toAdvancedUseQuery<
                TQueryFnData,
                TError,
                TData,
                TQueryKey,
                TNewParams,
                TPageParam
            >
        >
    }
    function transformReturn<TNewQueryFnData>(
        funcTransformReturn: (data: TQueryFnData) => TNewQueryFnData,
        addToQueryKey?: boolean
    ): ReturnType<
        typeof toAdvancedUseQuery<
            TQueryFnData,
            TError,
            TNewQueryFnData,
            TQueryKey,
            TParams,
            TPageParam
        >
    > {
        return transformUseReturn(
            toAdvancedUseQuery,
            func,
            funcTransformReturn,
            addToQueryKey
        ) as ReturnType<
            typeof toAdvancedUseQuery<
                TQueryFnData,
                TError,
                TNewQueryFnData,
                TQueryKey,
                TParams,
                TPageParam
            >
        >
    }

    function addQueryKey<TNewQueryKey extends QueryKey = QueryKey>(
        queryKey: TNewQueryKey
    ): ReturnType<
        typeof toAdvancedUseQuery<
            TQueryFnData,
            TError,
            TData,
            QueryKey,
            TParams,
            TPageParam
        >
    > {
        return addUseQueryKey(toAdvancedUseQuery, func, queryKey) as ReturnType<
            typeof toAdvancedUseQuery<
                TQueryFnData,
                TError,
                TData,
                QueryKey,
                TParams,
                TPageParam
            >
        >
    }

    Object.assign(use, {
        transformParams,
        transformReturn,
        addQueryKey,
    })

    return use as typeof use & {
        transformParams: typeof transformParams
        transformReturn: typeof transformReturn
        addQueryKey: typeof addQueryKey
    }
}

export function toUseQuery<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TParams extends QueryKey = QueryKey,
    TPageParam = unknown,
>(
    func: (...args: TParams) => TQueryFnData | Promise<TQueryFnData>
): ReturnType<
    typeof toAdvancedUseQuery<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TParams,
        TPageParam
    >
> {
    return toAdvancedUseQuery<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TParams,
        TPageParam
    >(({ params }) => func(...(params as TParams))) // add a function withDefault to add default params to this function (toUseQuery().withDefault({queryKey: ['example']})({params: [1]})
}

export function toAdvancedUseSuspenseQuery<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TParams extends QueryKey = QueryKey,
    TPageParam = unknown,
>(
    func: (
        ctx: FunctionContext<TParams, TPageParam, TQueryKey>
    ) => TQueryFnData | Promise<TQueryFnData>
) {
    function use<
        Options extends Omit<
            | (DefinedInitialDataOptions<
                  TQueryFnData,
                  TError,
                  TData,
                  TQueryKey
              > &
                  (ArrayContains<
                      UnionToArray<TParams['length']>,
                      0
                  > extends true // this check if the params can be optional because it require no arguments
                      ? { params?: TParams }
                      : { params: TParams }))
            | (UndefinedInitialDataOptions<
                  TQueryFnData,
                  TError,
                  TData,
                  TQueryKey
              > &
                  (ArrayContains<
                      UnionToArray<TParams['length']>,
                      0
                  > extends true // this check if the params can be optional because it require no arguments
                      ? { params?: TParams }
                      : { params: TParams }))
            | (UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & // this check if the params can be optional because it require no arguments
                  (ArrayContains<
                      UnionToArray<TParams['length']>,
                      0
                  > extends true
                      ? { params?: TParams }
                      : { params: TParams })),
            'queryKey'
        > & { queryKey?: TQueryKey } = Omit<
            UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & // this check if the params can be optional because it require no arguments
                (ArrayContains<UnionToArray<TParams['length']>, 0> extends true
                    ? { params?: TParams }
                    : { params: TParams }),
            'queryKey'
        > & { queryKey?: TQueryKey },
    >(options: Options, queryClient?: QueryClient) {
        return useQuery<TQueryFnData, TError, TData, TQueryKey>(
            {
                ...options,
                queryFn: (ctx) =>
                    func({
                        ...ctx,
                        params: options.params || [],
                    } as FunctionContext<TParams, TPageParam, TQueryKey>),
                queryKey: [
                    ...(options.queryKey ?? []),
                    ...(options.params ?? []),
                ],
                suspense: true,
            },
            queryClient
        ) as Options extends DefinedInitialDataOptions<
            TQueryFnData,
            TError,
            TData,
            TQueryKey
        >
            ? DefinedUseQueryResult<TData, TError>
            : UseQueryResult<TData, TError>
    }

    function transformParams<TNewParams extends QueryKey>(
        funcTransformParams: (...params: TNewParams) => TParams
    ): ReturnType<
        typeof toAdvancedUseSuspenseQuery<
            TQueryFnData,
            TError,
            TData,
            TQueryKey,
            TNewParams,
            TPageParam
        >
    > {
        return transformUseParams(
            toAdvancedUseSuspenseQuery,
            func,
            funcTransformParams
        ) as ReturnType<
            typeof toAdvancedUseSuspenseQuery<
                TQueryFnData,
                TError,
                TData,
                TQueryKey,
                TNewParams,
                TPageParam
            >
        >
    }

    function transformReturn<TNewQueryFnData>(
        funcTransformReturn: (data: TQueryFnData) => TNewQueryFnData,
        addToQueryKey?: boolean
    ): ReturnType<
        typeof toAdvancedUseSuspenseQuery<
            TQueryFnData,
            TError,
            TNewQueryFnData,
            TQueryKey,
            TParams,
            TPageParam
        >
    > {
        return transformUseReturn(
            toAdvancedUseSuspenseQuery,
            func,
            funcTransformReturn,
            addToQueryKey
        ) as ReturnType<
            typeof toAdvancedUseSuspenseQuery<
                TQueryFnData,
                TError,
                TNewQueryFnData,
                TQueryKey,
                TParams,
                TPageParam
            >
        >
    }

    function addQueryKey<TNewQueryKey extends QueryKey = QueryKey>(
        queryKey: TNewQueryKey
    ): ReturnType<
        typeof toAdvancedUseSuspenseQuery<
            TQueryFnData,
            TError,
            TData,
            TNewQueryKey,
            TParams,
            TPageParam
        >
    > {
        return addUseQueryKey(
            toAdvancedUseSuspenseQuery,
            func,
            queryKey
        ) as ReturnType<
            typeof toAdvancedUseSuspenseQuery<
                TQueryFnData,
                TError,
                TData,
                TNewQueryKey,
                TParams,
                TPageParam
            >
        >
    }

    Object.assign(use, {
        transformParams,
        transformReturn,
        addQueryKey,
    })

    return use as typeof use & {
        transformParams: typeof transformParams
        transformReturn: typeof transformReturn
        addQueryKey: typeof addQueryKey
    }
}

export function toUseSuspenseQuery<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TParams extends QueryKey = QueryKey,
    TPageParam = unknown,
>(
    func: (...args: TParams) => TQueryFnData | Promise<TQueryFnData>
): ReturnType<
    typeof toAdvancedUseSuspenseQuery<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TParams,
        TPageParam
    >
> {
    return toAdvancedUseSuspenseQuery<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TParams,
        TPageParam
    >(({ params }) => func(...(params as TParams))) // add a function withDefault to add default params to this function (toUseQuery().withDefault({queryKey: ['example']})({params: [1]})
}

export function toUseMutation<
    TData = unknown,
    TError = DefaultError,
    TVariables = void,
    TContext = unknown,
>(func: (variables: TVariables) => TData | Promise<TData>) {
    return function use<
        Options extends UseMutationOptions<
            TData,
            TError,
            TVariables,
            TContext
        > = UseMutationOptions<TData, TError, TVariables, TContext>,
    >(options: Options, queryClient?: QueryClient) {
        return useMutation<TData, TError, TVariables, TContext>(
            {
                ...options,
                mutationFn: (variables) => func(variables),
            },
            queryClient
        )
    }
}

export function toAdvancedUseInfiniteQuery<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = InfiniteData<TQueryFnData>,
    TQueryKey extends QueryKey = QueryKey,
    TParams extends QueryKey = QueryKey,
    TPageParam = unknown,
>(
    func: (
        ctx: FunctionContext<TParams, TPageParam, TQueryKey>
    ) => TQueryFnData | Promise<TQueryFnData>
) {
    function use<
        Options extends Omit<
            | (DefinedInitialDataInfiniteOptions<
                  TQueryFnData,
                  TError,
                  TData,
                  TQueryKey,
                  TPageParam
              > &
                  (ArrayContains<
                      UnionToArray<TParams['length']>,
                      0
                  > extends true // this check if the params can be optional because it require no arguments
                      ? { params?: TParams }
                      : { params: TParams }))
            | (UndefinedInitialDataInfiniteOptions<
                  TQueryFnData,
                  TError,
                  TData,
                  TQueryKey,
                  TPageParam
              > &
                  (ArrayContains<
                      UnionToArray<TParams['length']>,
                      0
                  > extends true // this check if the params can be optional because it require no arguments
                      ? { params?: TParams }
                      : { params: TParams }))
            | (UseInfiniteQueryOptions<
                  TQueryFnData,
                  TError,
                  TData,
                  TQueryKey,
                  TPageParam
              > & // this check if the params can be optional because it require no arguments
                  (ArrayContains<
                      UnionToArray<TParams['length']>,
                      0
                  > extends true
                      ? { params?: TParams }
                      : { params: TParams })),
            'queryKey'
        > & { queryKey?: TQueryKey } = Omit<
            UseInfiniteQueryOptions<
                TQueryFnData,
                TError,
                TData,
                TQueryKey,
                TPageParam
            > & // this check if the params can be optional because it require no arguments
                (ArrayContains<UnionToArray<TParams['length']>, 0> extends true
                    ? { params?: TParams }
                    : { params: TParams }),
            'queryKey'
        > & { queryKey?: TQueryKey },
    >(options: Options) {
        return useInfiniteQuery<
            TQueryFnData,
            TError,
            TData,
            TQueryKey,
            TPageParam
        >({
            ...options,
            queryFn: (ctx) =>
                func({
                    ...ctx,
                    params: options.params || [],
                } as FunctionContext<TParams, TPageParam, TQueryKey>),
            queryKey: [...(options.queryKey ?? []), ...(options.params ?? [])],
        }) as Options extends DefinedInitialDataInfiniteOptions<
            TQueryFnData,
            TError,
            TData,
            TQueryKey,
            TPageParam
        >
            ? DefinedUseInfiniteQueryResult<TData, TError>
            : UseInfiniteQueryResult<TData, TError>
    }

    function transformParams<TNewParams extends QueryKey>(
        funcTransformParams: (...params: TNewParams) => TParams
    ): ReturnType<
        typeof toAdvancedUseInfiniteQuery<
            TQueryFnData,
            TError,
            TData,
            TQueryKey,
            TNewParams,
            TPageParam
        >
    > {
        return transformUseParams(
            toAdvancedUseInfiniteQuery,
            func,
            funcTransformParams
        ) as ReturnType<
            typeof toAdvancedUseInfiniteQuery<
                TQueryFnData,
                TError,
                TData,
                TQueryKey,
                TNewParams,
                TPageParam
            >
        >
    }

    function transformReturn<TNewQueryFnData>(
        funcTransformReturn: (data: TQueryFnData) => TNewQueryFnData,
        addToQueryKey?: boolean
    ): ReturnType<
        typeof toAdvancedUseInfiniteQuery<
            TQueryFnData,
            TError,
            TNewQueryFnData,
            TQueryKey,
            TParams,
            TPageParam
        >
    > {
        return transformUseReturn(
            toAdvancedUseInfiniteQuery,
            func,
            funcTransformReturn,
            addToQueryKey
        ) as ReturnType<
            typeof toAdvancedUseInfiniteQuery<
                TQueryFnData,
                TError,
                TNewQueryFnData,
                TQueryKey,
                TParams,
                TPageParam
            >
        >
    }

    function addQueryKey<TNewQueryKey extends QueryKey = QueryKey>(
        queryKey: TNewQueryKey
    ): ReturnType<
        typeof toAdvancedUseInfiniteQuery<
            TQueryFnData,
            TError,
            TData,
            TNewQueryKey,
            TParams,
            TPageParam
        >
    > {
        return addUseQueryKey(
            toAdvancedUseInfiniteQuery,
            func,
            queryKey
        ) as ReturnType<
            typeof toAdvancedUseInfiniteQuery<
                TQueryFnData,
                TError,
                TData,
                TNewQueryKey,
                TParams,
                TPageParam
            >
        >
    }

    Object.assign(use, {
        transformParams,
        transformReturn,
        addQueryKey,
    })

    return use as typeof use & {
        transformParams: typeof transformParams
        transformReturn: typeof transformReturn
        addQueryKey: typeof addQueryKey
    }
}

// const useAdvancedInfiniteUser = toAdvancedUseInfiniteQuery(
//     (
//         { queryKey: [id], pageParam }: FunctionContext<[id: number], number> // here you have to give a type to the pageParam if you want to use it
//     ) =>
//         fetch(
//             `https://jsonplaceholder.typicode.com/todos/${id}?_page=${pageParam}`
//         ).then((res) => res.json()) as Promise<{ id: number; title: string }>
// )

// const { data, fetchNextPage } = useAdvancedInfiniteUser({
//     queryKey: [1],
//     params: [1],
//     initialPageParam: 1,
//     getNextPageParam: (lastPage, allPages, lastPageParam) => lastPageParam + 1, // return null if there is no more pages after the actual page
//     getPreviousPageParam: (firstPage, allPages, firstPageParam) =>
//         firstPageParam - 1, // return null if there is no more pages before the actual page
// })

// const useAdvancedUser = toAdvancedUseQuery(
//     (
//         { queryKey: [id] }: FunctionContext<[id: number], number> // here you have to give a type to the pageParam if you want to use it
//     ) =>
//         fetch(`https://jsonplaceholder.typicode.com/todos/${id}`).then((res) =>
//             res.json()
//         ) as Promise<{ id: number; title: string }>
// )

// const { data: data1 } = useAdvancedUser({
//     queryKey: [1],
//     params: [1],
//     initialData: { id: 1, title: 'test' },
// })

// const useComments = toUseQuery(
//     (
//         commentId: number, // the type of the params is inferred from the function arguments
//         postId: number
//     ) =>
//         fetch(
//             `https://jsonplaceholder.typicode.com/todos/${postId}/comments?id=${commentId}`
//         ).then((res) => res.json()) as Promise<{ id: number; title: string }>
// )

// const { data: data2 } = useComments({
//     queryKey: [1],
//     params: [1, 2],
//     initialData: { id: 1, title: 'test' },
// })

// const useCommentsWithPostId1 = useComments.transformParams((commentId: number) => {
//     return [commentId, 1]
// })

// const { data: data3 } = t({
//     queryKey: [1],
//     params: [2],
//     initialData: { id: 1, title: 'test' },
// })

// const useCreateUser = toUseMutation(({ name }: { name: string }) =>
//     fetch(`https://jsonplaceholder.typicode.com/todos`, {
//         method: 'POST',
//         body: JSON.stringify({ name }),
//     }).then((res) => res.json())
// )

// const { mutate } = useCreateUser({
//     mutationKey: ['createUser'],
// })
