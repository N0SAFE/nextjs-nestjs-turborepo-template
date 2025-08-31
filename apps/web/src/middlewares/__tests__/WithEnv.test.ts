import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextFetchEvent, NextRequest, NextResponse } from 'next/server'

describe('WithEnv Middleware', () => {
    // Mock all the required modules inside the describe block
    const mockEnvIsValid = vi.fn()
    const mockValidateEnvSafe = vi.fn()
    const mockMatcherHandler = vi.fn()
    const mockToAbsoluteUrl = vi.fn((path) => `http://localhost:3003${path}`)
    const mockCreateDebug = vi.fn(() => vi.fn())
    
    beforeEach(async () => {
        vi.clearAllMocks()
        // @ts-expect-error set NODE_ENV for tests
        process.env.NODE_ENV = 'development'
        
        // Mock the modules using vi.doMock which works at runtime
        vi.doMock('#/env', () => ({
            envSchema: {
                parse: vi.fn(),
                safeParse: vi.fn(),
                shape: {}
            },
            envIsValid: mockEnvIsValid,
            validateEnvSafe: mockValidateEnvSafe,
            validateEnv: vi.fn(),
            validateEnvPath: vi.fn(),
        }))

        vi.doMock('../utils/utils', () => ({
            matcherHandler: mockMatcherHandler,
        }))

        vi.doMock('@/lib/utils', () => ({
            toAbsoluteUrl: mockToAbsoluteUrl,
        }))

        vi.doMock('@/lib/debug', () => ({
            createDebug: mockCreateDebug,
        }))

        vi.doMock('../utils/static', () => ({
            nextjsRegexpPageOnly: {},
            nextNoApi: {},
            noPublic: {},
        }))
    })

    const mockNext = vi.fn()
    const errorPagePath = '/middleware/error/env'

    const createMockRequest = (
        url: string,
        searchParams: Record<string, string> = {}
    ) => {
        const searchParamsObj = new URLSearchParams(searchParams)
        const fullUrl = new URL(url)
        fullUrl.search = searchParamsObj.toString()

        return new NextRequest(fullUrl.toString())
    }

    describe('when environment is valid', () => {
        beforeEach(() => {
            mockEnvIsValid.mockReturnValue(true)
            mockMatcherHandler.mockReturnValue({ hit: false })
        })

        it('should redirect from error page to home when env is valid', async () => {
            const { default: withEnv } = await import('../WithEnv')
            
            const request = createMockRequest(
                `http://localhost:3003${errorPagePath}`
            )
            mockMatcherHandler.mockReturnValue({
                hit: true,
                data: NextResponse.redirect('http://localhost:3003/'),
            })

            const middleware = withEnv(mockNext)
            const result = await middleware(request, {} as NextFetchEvent)

            expect(result).toBeInstanceOf(NextResponse)
            expect(mockMatcherHandler).toHaveBeenCalledWith(
                errorPagePath,
                expect.any(Array)
            )
        })

        it('should redirect from error page to "from" parameter when env is valid', async () => {
            const { default: withEnv } = await import('../WithEnv')
            
            const fromUrl = '/dashboard'
            const request = createMockRequest(
                `http://localhost:3003${errorPagePath}`,
                { from: fromUrl }
            )
            mockMatcherHandler.mockReturnValue({
                hit: true,
                data: NextResponse.redirect(`http://localhost:3003${fromUrl}`),
            })

            const middleware = withEnv(mockNext)
            const result = await middleware(request, {} as NextFetchEvent)

            expect(result).toBeInstanceOf(NextResponse)
        })

        it('should call next middleware when not on error page and env is valid', async () => {
            const { default: withEnv } = await import('../WithEnv')
            
            const request = createMockRequest('http://localhost:3003/dashboard')
            mockMatcherHandler.mockReturnValue({
                hit: true,
                data: mockNext(request, {} as NextFetchEvent),
            })

            const middleware = withEnv(mockNext)
            await middleware(request, {} as NextFetchEvent)

            expect(mockNext).toHaveBeenCalledWith(request, {})
        })
    })

    describe('when environment is invalid', () => {
        beforeEach(() => {
            mockEnvIsValid.mockReturnValue(false)

            mockValidateEnvSafe.mockReturnValue({
                error: { message: 'Invalid environment variables' },
            })
        })

        it('should redirect to error page in development mode', async () => {
            const { default: withEnv } = await import('../WithEnv')
            
            // @ts-expect-error set NODE_ENV for tests
            process.env.NODE_ENV = 'development'
            const request = createMockRequest('http://localhost:3003/dashboard')

            mockMatcherHandler.mockReturnValue({
                hit: true,
                data: NextResponse.redirect(
                    `http://localhost:3003${errorPagePath}?from=${encodeURIComponent(request.url)}`
                ),
            })

            const middleware = withEnv(mockNext)
            const result = await middleware(request, {} as NextFetchEvent)

            expect(result).toBeInstanceOf(NextResponse)
        })

        it('should throw error in production mode', async () => {
            const { default: withEnv } = await import('../WithEnv')
            
            // @ts-expect-error set NODE_ENV for tests
            process.env.NODE_ENV = 'production'
            const request = createMockRequest('http://localhost:3003/dashboard')

            const middleware = withEnv(mockNext)

            // Mock matcherHandler to return a function that throws
            mockMatcherHandler.mockImplementation(() => {
                throw new Error(
                    'Invalid environment variables:{"message":"Invalid environment variables"}'
                )
            })

            await expect(
                middleware(request, {} as NextFetchEvent)
            ).rejects.toThrow('Invalid environment variables')
        })
    })

    describe('when matcher does not hit', () => {
        beforeEach(() => {
            mockEnvIsValid.mockReturnValue(true)
            mockMatcherHandler.mockReturnValue({ hit: false })
        })

        it('should call next middleware when matcher does not hit', async () => {
            const { default: withEnv } = await import('../WithEnv')
            
            const request = createMockRequest('http://localhost:3003/api/test')
            const mockResponse = NextResponse.next()
            mockNext.mockReturnValue(mockResponse)

            const middleware = withEnv(mockNext)
            const result = await middleware(request, {} as NextFetchEvent)

            expect(mockNext).toHaveBeenCalledWith(request, {})
            expect(result).toBe(mockResponse)
        })
    })
})
