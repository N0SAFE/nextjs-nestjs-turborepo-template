import { Test, type TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { HealthController } from "./health.controller";
import { HealthService } from "../services/health.service";

// Mock auth user for requireAuth middleware
const mockAuthUser = {
    id: "auth-user-1",
    name: "Auth User",
    email: "auth@example.com",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

// Store test handler reference for potential direct testing
let __testHandler: ((...args: unknown[]) => unknown) | null = null;

// Create chainable mock for implement().use().handler() pattern
const createImplementMock = () => ({
    use: vi.fn(() => ({
        handler: vi.fn((handlerFn: (...args: unknown[]) => unknown) => {
            __testHandler = handlerFn;
            return {
                handler: handlerFn,
                context: { auth: { user: mockAuthUser } },
            };
        }),
    })),
    handler: vi.fn((handlerFn: (...args: unknown[]) => unknown) => {
        __testHandler = handlerFn;
        return {
            handler: handlerFn,
        };
    }),
});

// Mock @orpc/nest module
vi.mock("@orpc/nest", () => ({
    implement: vi.fn(() => createImplementMock()),
    Implement: vi.fn(() => () => {}),
}));

// Mock requireAuth middleware to do nothing (pass through)
vi.mock("@/core/modules/auth/orpc/middlewares", () => ({
    requireAuth: vi.fn(() => ({})),
}));

describe("HealthController", () => {
    let controller: HealthController;
    let service: HealthService;

    beforeEach(async () => {
        const mockHealthService = {
            getHealth: vi.fn(),
            getDetailedHealth: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [
                {
                    provide: HealthService,
                    useFactory: () => mockHealthService,
                },
            ],
        }).compile();

        controller = module.get<HealthController>(HealthController);
        service = module.get<HealthService>(HealthService);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });

    describe("ORPC implementation methods", () => {
        it("should have check method that returns implementation handler", () => {
            const implementation = controller.check() as ReturnType<typeof controller.check> & {
                handler: () => unknown;
            };
            expect(implementation).toBeDefined();
            expect(typeof implementation.handler).toBe("function");
        });

        it("should have detailed method that returns implementation handler", () => {
            const implementation = controller.detailed() as ReturnType<typeof controller.detailed> & {
                handler: () => unknown;
            };
            expect(implementation).toBeDefined();
            expect(typeof implementation.handler).toBe("function");
        });
    });

    describe("Service integration", () => {
        it("should have service injected properly", () => {
            expect(service).toBeDefined();
            expect(service.getHealth).toBeDefined();
            expect(service.getDetailedHealth).toBeDefined();
        });

        it("should be able to call getHealth service method directly", () => {
            const mockHealth = {
                status: "ok",
                timestamp: new Date().toISOString(),
                service: "nestjs-api",
            };
            vi.mocked(service.getHealth).mockReturnValue(mockHealth);

            const result = service.getHealth();
            expect(result).toEqual(mockHealth);
            expect(service.getHealth).toHaveBeenCalledOnce();
        });

        it("should be able to call getDetailedHealth service method directly", async () => {
            const mockDetailedHealth = {
                status: "ok" as const,
                timestamp: new Date().toISOString(),
                service: "nestjs-api",
                uptime: 123,
                memory: { used: 1000, free: 2000, total: 3000 },
                database: { status: "ok" as const, timestamp: "2023-01-01T00:00:00Z", responseTime: 100 },
            };
            vi.mocked(service.getDetailedHealth).mockResolvedValue(mockDetailedHealth);

            const result = await service.getDetailedHealth();
            expect(result).toEqual(mockDetailedHealth);
            expect(service.getDetailedHealth).toHaveBeenCalledOnce();
        });
    });
});
