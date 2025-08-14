import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toUseQuery, toUseMutation } from '../tanstack-query'

// Create a wrapper component for QueryClient
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    })

    return function QueryClientWrapper({
        children,
    }: {
        children: React.ReactNode
    }) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        )
    }
}

describe('TanStack Query utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('toUseQuery', () => {
        it('should create a query hook from a function', async () => {
            const mockFetch = vi.fn().mockResolvedValue({ id: 1, name: 'John' })
            const useUser = toUseQuery((id: number) => mockFetch(id))

            const { result } = renderHook(() => useUser({ params: [1] }), {
                wrapper: createWrapper(),
            })

            expect(result.current.isLoading).toBe(true)
            expect(mockFetch).toHaveBeenCalledWith(1)
        })

        it('should handle query parameters correctly', async () => {
            const mockFetch = vi
                .fn()
                .mockResolvedValue([{ id: 1, comment: 'test' }])
            const useComments = toUseQuery((postId: number, userId: number) =>
                mockFetch(postId, userId)
            )

            const { result } = renderHook(
                () => useComments({ params: [1, 2] }),
                { wrapper: createWrapper() }
            )

            expect(result.current.isLoading).toBe(true)
            expect(mockFetch).toHaveBeenCalledWith(1, 2)
        })

        it('should support query options', async () => {
            const mockFetch = vi.fn().mockResolvedValue({ id: 1, name: 'John' })
            const useUser = toUseQuery((id: number) => mockFetch(id))

            const { result } = renderHook(
                () =>
                    useUser({
                        params: [1],
                        enabled: false,
                        staleTime: 5000,
                    }),
                { wrapper: createWrapper() }
            )

            expect(result.current.isLoading).toBe(false)
            expect(mockFetch).not.toHaveBeenCalled()
        })
    })

    describe('toUseMutation', () => {
        it('should create a mutation hook from a function', async () => {
            const mockCreate = vi
                .fn()
                .mockResolvedValue({ id: 1, name: 'John' })
            const useCreateUser = toUseMutation((data: { name: string }) =>
                mockCreate(data)
            )

            const { result } = renderHook(() => useCreateUser({}), {
                wrapper: createWrapper(),
            })

            expect(result.current.isIdle).toBe(true)

            result.current.mutate({ name: 'John' })

            await waitFor(() => {
                expect(mockCreate).toHaveBeenCalledWith({ name: 'John' })
            })
        })

        it('should support mutation options', async () => {
            const mockCreate = vi
                .fn()
                .mockResolvedValue({ id: 1, name: 'John' })
            const onSuccess = vi.fn()
            const onError = vi.fn()

            const useCreateUser = toUseMutation((data: { name: string }) =>
                mockCreate(data)
            )

            const { result } = renderHook(
                () =>
                    useCreateUser({
                        onSuccess,
                        onError,
                    }),
                { wrapper: createWrapper() }
            )

            result.current.mutate({ name: 'John' })

            await waitFor(() => {
                expect(mockCreate).toHaveBeenCalledWith({ name: 'John' })
            })
        })
    })

    describe('transformations', () => {
        it('should support parameter transformation', async () => {
            const mockFetch = vi
                .fn()
                .mockResolvedValue({ id: 1, comment: 'test' })
            const useComments = toUseQuery((postId: number, userId: number) =>
                mockFetch(postId, userId)
            )

            const useCommentsWithFixedUser = useComments.transformParams(
                (postId: number) => {
                    return [postId, 123] // Fixed user ID
                }
            )

            const { result } = renderHook(
                () => useCommentsWithFixedUser({ params: [1] }),
                { wrapper: createWrapper() }
            )

            expect(result.current.isLoading).toBe(true)
            expect(mockFetch).toHaveBeenCalledWith(1, 123)
        })

        it('should support return transformation', async () => {
            const mockFetch = vi
                .fn()
                .mockResolvedValue({ firstName: 'John', lastName: 'Doe' })
            const useUser = toUseQuery((id: number) => mockFetch(id))

            const useUserFullName = useUser.transformReturn((user) => ({
                ...user,
                fullName: `${user.firstName} ${user.lastName}`,
            }))

            const { result } = renderHook(
                () => useUserFullName({ params: [1] }),
                { wrapper: createWrapper() }
            )

            expect(result.current.isLoading).toBe(true)
            expect(mockFetch).toHaveBeenCalledWith(1)
        })

        it('should support adding query keys', async () => {
            const mockFetch = vi.fn().mockResolvedValue({ id: 1, name: 'John' })
            const useUser = toUseQuery((id: number) => mockFetch(id))

            const useUserWithCustomKey = useUser.addQueryKey(['custom', 'key'])

            const { result } = renderHook(
                () => useUserWithCustomKey({ params: [1] }),
                { wrapper: createWrapper() }
            )

            expect(result.current.isLoading).toBe(true)
            expect(mockFetch).toHaveBeenCalledWith(1)
        })
    })
})
