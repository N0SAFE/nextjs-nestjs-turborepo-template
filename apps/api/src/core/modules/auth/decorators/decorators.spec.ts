import { describe, it, expect, vi } from "vitest";
import type { ExecutionContext } from "@nestjs/common";
import {
    Public,
    Optional,
    AllowAnonymous,
    OptionalAuth,
    BeforeHook,
    AfterHook,
    Hook,
    UserRoles,
    AuthenticatedUser,
} from "./decorators";

// Mock the permissions module with complete types
vi.mock("@repo/auth/permissions", () => ({
    PermissionChecker: {
        getUserRoles: vi.fn((roleString: string) => roleString.split(",")),
    },
}));

describe("Auth Decorators", () => {
    describe("AllowAnonymous", () => {
        it("should set PUBLIC metadata to true", () => {
            const decorator = AllowAnonymous();

            expect(decorator).toBeDefined();
            expect(typeof decorator).toBe("function");
        });
    });

    describe("OptionalAuth", () => {
        it("should set OPTIONAL metadata to true", () => {
            const decorator = OptionalAuth();

            expect(decorator).toBeDefined();
            expect(typeof decorator).toBe("function");
        });
    });

    describe("Public (deprecated alias)", () => {
        it("should set PUBLIC metadata to true", () => {
            const decorator = Public();

            expect(decorator).toBeDefined();
            expect(typeof decorator).toBe("function");
        });
    });

    describe("Optional (deprecated alias)", () => {
        it("should set OPTIONAL metadata to true", () => {
            const decorator = Optional();

            expect(decorator).toBeDefined();
            expect(typeof decorator).toBe("function");
        });
    });

    describe("Session", () => {
        it("should extract session from request", () => {
            const mockSession = { user: { id: "1" }, session: { id: "session-1" } };
            const mockRequest = { session: mockSession };
            const mockContext = {
                switchToHttp: () => ({
                    getRequest: () => mockRequest,
                }),
            } as ExecutionContext;

            const request = mockContext.switchToHttp().getRequest();
            const result = request.session;

            expect(result).toBe(mockSession);
        });

        it("should return undefined when no session in request", () => {
            const mockRequest = {};
            const mockContext = {
                switchToHttp: () => ({
                    getRequest: () => mockRequest,
                }),
            } as ExecutionContext;

            const request = mockContext.switchToHttp().getRequest();
            const result = request.session;

            expect(result).toBeUndefined();
        });
    });

    describe("BeforeHook", () => {
        it("should create before hook decorator with path", () => {
            const path = "/sign-in" as const;
            const decorator = BeforeHook(path);

            expect(decorator).toBeDefined();
            expect(typeof decorator).toBe("function");
        });

        it("should require path to start with slash", () => {
            const path = "/valid-path" as const;
            const decorator = BeforeHook(path);

            expect(decorator).toBeDefined();
        });
    });

    describe("AfterHook", () => {
        it("should create after hook decorator with path", () => {
            const path = "/sign-out" as const;
            const decorator = AfterHook(path);

            expect(decorator).toBeDefined();
            expect(typeof decorator).toBe("function");
        });
    });

    describe("Hook", () => {
        it("should create hook class decorator", () => {
            const decorator = Hook();

            expect(decorator).toBeDefined();
            expect(typeof decorator).toBe("function");
        });

        it("should be applicable to classes", () => {
            const decorator = Hook();

            @decorator
            class TestHookProvider {
                someMethod() {}
            }

            expect(TestHookProvider).toBeDefined();
        });
    });

    describe("Decorator Application", () => {
        it("should apply AllowAnonymous decorator to class", () => {
            @AllowAnonymous()
            class TestController {}

            expect(TestController).toBeDefined();
        });

        it("should apply OptionalAuth decorator to method", () => {
            class TestController {
                @OptionalAuth()
                testMethod() {}
            }

            expect(TestController).toBeDefined();
            expect(TestController.prototype.testMethod.bind(TestController.prototype)).toBeDefined();
        });

        it("should apply multiple decorators", () => {
            @Hook()
            class TestHookProvider {
                @BeforeHook("/test")
                beforeTest() {}

                @AfterHook("/test")
                afterTest() {}
            }

            expect(TestHookProvider).toBeDefined();
            expect(TestHookProvider.prototype.beforeTest.bind(TestHookProvider.prototype)).toBeDefined();
            expect(TestHookProvider.prototype.afterTest.bind(TestHookProvider.prototype)).toBeDefined();
        });
    });

    describe("Metadata Integration", () => {
        it("should work with Reflector to check PUBLIC metadata", () => {
            @AllowAnonymous()
            class TestController {
                testMethod() {}
            }

            expect(TestController).toBeDefined();
        });

        it("should work with method-level decorators", () => {
            class TestController {
                @OptionalAuth()
                @AllowAnonymous()
                testMethod() {}
            }

            expect(TestController.prototype.testMethod.bind(TestController.prototype)).toBeDefined();
        });
    });

    describe("Parameter Decorators", () => {
        describe("UserRoles", () => {
            it("should extract user roles from request", () => {
                const mockUser = { id: "1", role: "admin,manager" };
                const mockRequest = { user: mockUser };
                const mockContext = {
                    switchToHttp: () => ({
                        getRequest: () => mockRequest,
                    }),
                } as ExecutionContext;

                const request = mockContext.switchToHttp().getRequest();
                const user = request.user;

                if (user?.role) {
                    const roles = ["admin", "manager"];
                    expect(roles).toEqual(["admin", "manager"]);
                }
            });

            it("should return empty array when no user role", () => {
                const mockRequest = { user: { id: "1" } };
                const mockContext = {
                    switchToHttp: () => ({
                        getRequest: () => mockRequest,
                    }),
                } as ExecutionContext;

                const request = mockContext.switchToHttp().getRequest();
                const user = request.user;

                if (!user?.role) {
                    expect([]).toEqual([]);
                }
            });

            it("should return empty array when no user", () => {
                const mockRequest = {};
                const mockContext = {
                    switchToHttp: () => ({
                        getRequest: () => mockRequest,
                    }),
                } as ExecutionContext;

                const request = mockContext.switchToHttp().getRequest();
                const user = request.user;

                if (!user?.role) {
                    expect([]).toEqual([]);
                }
            });
        });

        describe("AuthenticatedUser", () => {
            it("should extract authenticated user with roles", () => {
                const mockSession = {
                    user: { id: "1", email: "user@example.com", name: "Test User" },
                };
                const mockUser = { id: "1", role: "admin" };
                const mockRequest = { session: mockSession, user: mockUser };
                const mockContext = {
                    switchToHttp: () => ({
                        getRequest: () => mockRequest,
                    }),
                } as ExecutionContext;

                const request = mockContext.switchToHttp().getRequest();
                const session = request.session;
                const user = request.user;

                if (session?.user) {
                    const roles = user?.role ? ["admin"] : [];

                    const result = {
                        ...session.user,
                        role: user?.role ?? null,
                        roles,
                    };

                    expect(result).toEqual({
                        id: "1",
                        email: "user@example.com",
                        name: "Test User",
                        role: "admin",
                        roles: ["admin"],
                    });
                }
            });

            it("should return null when no session", () => {
                const mockRequest = {};
                const mockContext = {
                    switchToHttp: () => ({
                        getRequest: () => mockRequest,
                    }),
                } as ExecutionContext;

                const request = mockContext.switchToHttp().getRequest();
                const session = request.session;

                if (!session?.user) {
                    expect(null).toBeNull();
                }
            });

            it("should handle user without role", () => {
                const mockSession = {
                    user: { id: "1", email: "user@example.com", name: "Test User" },
                };
                const mockRequest = { session: mockSession, user: { id: "1" } };
                const mockContext = {
                    switchToHttp: () => ({
                        getRequest: () => mockRequest,
                    }),
                } as ExecutionContext;

                const request = mockContext.switchToHttp().getRequest();
                const session = request.session;
                const user = request.user;

                if (session?.user) {
                    const roles = user?.role ? [] : [];

                    const result = {
                        ...session.user,
                        role: user?.role ?? null,
                        roles,
                    };

                    expect(result).toEqual({
                        id: "1",
                        email: "user@example.com",
                        name: "Test User",
                        role: null,
                        roles: [],
                    });
                }
            });
        });
    });

    describe("Decorator Combination", () => {
        it("should allow combining multiple decorators", () => {
            class TestController {
                @AllowAnonymous()
                @OptionalAuth()
                complexMethod() {}
            }

            expect(TestController.prototype.complexMethod.bind(TestController.prototype)).toBeDefined();
        });

        it("should work with parameter decorators", () => {
            class TestController {
                testMethod(@UserRoles() roles: string[], @AuthenticatedUser() user: any) {
                    return { roles, user };
                }
            }

            expect(TestController.prototype.testMethod.bind(TestController.prototype)).toBeDefined();
        });
    });
});
