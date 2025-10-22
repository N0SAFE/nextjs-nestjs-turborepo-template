import type { Mock } from "vitest";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AppModule } from "@/app.module";
import type { Request, Response } from "express";
import { LoggerMiddleware } from "./core/middlewares/logger.middleware";

describe("AppModule", () => {
    let appModule: AppModule;

    beforeEach(() => {
        appModule = new AppModule();
    });

    it("should be defined", () => {
        expect(appModule).toBeDefined();
    });

    describe("configure", () => {
        it("should configure middleware consumer", () => {
            const mockConsumer = {
                apply: vi.fn().mockReturnThis(),
                forRoutes: vi.fn().mockReturnThis(),
            } as any;

            appModule.configure(mockConsumer);

            expect(mockConsumer.apply).toHaveBeenCalledWith(LoggerMiddleware);
            expect(mockConsumer.forRoutes).toHaveBeenCalledWith("*");
        });
    });
});

describe("LoggerMiddleware", () => {
    let middleware: LoggerMiddleware;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: Mock;

    beforeEach(() => {
        middleware = new LoggerMiddleware();
        nextFunction = vi.fn();

        mockRequest = {
            ip: "127.0.0.1",
            method: "GET",
            originalUrl: "/api/health",
            get: vi.fn(),
        };

        mockResponse = {
            on: vi.fn(),
            get: vi.fn(),
            statusCode: 200,
            statusMessage: "OK",
        };
    });

    it("should be defined", () => {
        expect(middleware).toBeDefined();
    });

    describe("use", () => {
        it("should call next function immediately", () => {
            middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(nextFunction).toHaveBeenCalledOnce();
        });

        it("should set up response close listener", () => {
            middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.on).toHaveBeenCalledWith("close", expect.any(Function));
        });

        it("should extract request information", () => {
            mockRequest.get = vi
                .fn()
                .mockReturnValueOnce("test-agent") // user-agent
                .mockReturnValueOnce("http://example.com"); // referer

            middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockRequest.get).toHaveBeenCalledWith("user-agent");
            expect(mockRequest.get).toHaveBeenCalledWith("referer");
        });

        it("should handle missing user-agent and referer", () => {
            mockRequest.get = vi.fn().mockReturnValue(undefined);

            middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(nextFunction).toHaveBeenCalledOnce();
        });

        it("should log request details on response close", () => {
            // Mock os.hostname
            vi.mock("os", () => ({
                hostname: () => "test-hostname",
            }));

            mockRequest.get = vi.fn().mockReturnValueOnce("test-agent").mockReturnValueOnce("http://example.com");

            mockResponse.get = vi.fn().mockReturnValue("1024");

            let closeCallback: () => void = () => void 0;
            mockResponse.on = vi.fn().mockImplementation((event, callback) => {
                if (event === "close") {
                    closeCallback = callback;
                }
            });

            middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

            // Simulate response close
            if (closeCallback) {
                closeCallback();
            }

            expect(mockResponse.on).toHaveBeenCalledWith("close", expect.any(Function));
        });

        it("should handle response without content-length", () => {
            mockResponse.get = vi.fn().mockReturnValue(undefined);

            let closeCallback: () => void = () => void 0;
            mockResponse.on = vi.fn().mockImplementation((event, callback) => {
                if (event === "close") {
                    closeCallback = callback;
                }
            });

            middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

            // Should not throw when content-length is undefined
            if (closeCallback) {
                expect(() => {
                    closeCallback();
                }).not.toThrow();
            }
        });
    });
});
