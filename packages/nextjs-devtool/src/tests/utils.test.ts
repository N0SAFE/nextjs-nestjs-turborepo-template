/**
 * Unit tests for DevTool utility functions
 *
 * Tests all utility functions with complete type safety and comprehensive coverage.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { DevToolPlugin, PluginContract } from "../types";
import {
    createPluginContract,
    registerPlugin,
    validatePlugin,
    resolveDependencies,
    deepFreeze,
    getEnvVar,
    safeJsonParse,
    debounce,
    formatPluginInfo,
    assertNever,
    loadPluginComponent,
} from "../utils";

describe("DevTool Utilities", () => {
    describe("createPluginContract", () => {
        it("should create a valid plugin contract", () => {
            const procedures = {
                getRoutes: { input: "string", output: "object" },
                getBundle: { input: "object", output: "array" },
            };

            const contract = createPluginContract(procedures);

            expect(contract).toEqual({
                procedures,
                namespace: "",
                version: "1.0.0",
            });
        });

        it("should handle empty procedures", () => {
            const contract = createPluginContract({});

            expect(contract.procedures).toEqual({});
            expect(contract.namespace).toBe("");
            expect(contract.version).toBe("1.0.0");
        });
    });

    describe("registerPlugin", () => {
        const mockRegistry = {
            registerPlugin: vi.fn(),
        };

        const validPlugin: DevToolPlugin = {
            name: "test-plugin",
            version: "1.0.0",
            kind: "module",
            contract: {
                namespace: "test",
                procedures: {},
            },
            exports: {
                components: {},
                hooks: {},
            },
            meta: {
                description: "Test plugin",
                displayName: "Test Plugin",
            },
        };

        beforeEach(() => {
            mockRegistry.registerPlugin.mockClear();
        });

        it("should throw error for plugin missing name", () => {
            const invalidPlugin = { ...validPlugin, name: "" };

            expect(() => registerPlugin(invalidPlugin, mockRegistry)).toThrow("Invalid plugin: missing required fields");
            expect(mockRegistry.registerPlugin).not.toHaveBeenCalled();
        });

        it("should throw error for plugin missing version", () => {
            const invalidPlugin = { ...validPlugin, version: "" };

            expect(() => registerPlugin(invalidPlugin, mockRegistry)).toThrow("Invalid plugin: missing required fields");
        });

        it("should throw error for plugin missing namespace", () => {
            const invalidPlugin = { ...validPlugin, namespace: "" };

            expect(() => registerPlugin(invalidPlugin, mockRegistry)).toThrow("Invalid plugin: missing required fields");
        });
    });

    describe("validatePlugin", () => {
        const basePlugin: DevToolPlugin = {
            name: "test-plugin",
            version: "1.0.0",
            kind: "core",
            contract: { namespace: "test", procedures: {} },
            exports: {},
            meta: { description: "Test" },
        };

        it("should fail validation for missing name", () => {
            const plugin = { ...basePlugin, name: "" };
            expect(validatePlugin(plugin)).toBe(false);
        });

        it("should fail validation for missing version", () => {
            const plugin = { ...basePlugin, version: "" };
            expect(validatePlugin(plugin)).toBe(false);
        });

        it("should fail validation for undefined fields", () => {
            const plugin = { ...basePlugin, name: undefined as any };
            expect(validatePlugin(plugin)).toBe(false);
        });

        it("should fail validation for null fields", () => {
            const plugin = { ...basePlugin, version: null as any };
            expect(validatePlugin(plugin)).toBe(false);
        });
    });

    describe("resolveDependencies", () => {
        it("should handle empty plugin list", () => {
            const dependencies = resolveDependencies([]);
            expect(dependencies.size).toBe(0);
        });

        it("should handle plugins without dependencies", () => {
            const plugins: DevToolPlugin[] = [
                {
                    name: "simple-plugin",
                    version: "1.0.0",
                    kind: "module",
                    contract: { namespace: "simple", procedures: {} },
                    exports: {},
                    meta: { description: "Simple plugin" },
                },
            ];

            const dependencies = resolveDependencies(plugins);
            expect(dependencies.get("simple-plugin")).toEqual([]);
        });
    });

    describe("deepFreeze", () => {
        it("should freeze a simple object", () => {
            const obj = { name: "test", value: 42 };
            const frozen = deepFreeze(obj);

            expect(Object.isFrozen(frozen)).toBe(true);
            expect(() => {
                (frozen as any).name = "changed";
            }).toThrow();
        });

        it("should deeply freeze nested objects", () => {
            const obj = {
                level1: {
                    level2: {
                        value: "test",
                    },
                },
            };
            const frozen = deepFreeze(obj);

            expect(Object.isFrozen(frozen)).toBe(true);
            expect(Object.isFrozen(frozen.level1)).toBe(true);
            expect(Object.isFrozen(frozen.level1.level2)).toBe(true);
        });

        it("should freeze arrays", () => {
            const arr = [1, 2, { nested: "value" }];
            const frozen = deepFreeze(arr);

            expect(Object.isFrozen(frozen)).toBe(true);
            expect(Object.isFrozen(frozen[2])).toBe(true);
        });
    });

    describe("getEnvVar", () => {
        const originalWindow = global.window;
        const originalProcess = process.env;

        afterEach(() => {
            global.window = originalWindow;
            process.env = originalProcess;
        });

        it("should get environment variable from process.env in server environment", () => {
            delete (global as any).window;
            process.env.TEST_VAR = "server-value";

            const result = getEnvVar("TEST_VAR");
            expect(result).toBe("server-value");
        });

        it("should return default value when env var not found", () => {
            delete (global as any).window;
            delete process.env.MISSING_VAR;

            const result = getEnvVar("MISSING_VAR", "default");
            expect(result).toBe("default");
        });

        it("should return empty string when no default provided", () => {
            delete (global as any).window;
            delete process.env.MISSING_VAR;

            const result = getEnvVar("MISSING_VAR");
            expect(result).toBe("");
        });

        it("should get environment variable from window in client environment", () => {
            global.window = {
                __NEXT_DATA__: {
                    env: {
                        TEST_VAR: "client-value",
                    },
                },
            } as any;

            const result = getEnvVar("TEST_VAR");
            expect(result).toBe("client-value");
        });
    });

    describe("safeJsonParse", () => {
        it("should parse valid JSON", () => {
            const json = '{"name": "test", "value": 42}';
            const result = safeJsonParse(json, {});

            expect(result).toEqual({ name: "test", value: 42 });
        });

        it("should return fallback for invalid JSON", () => {
            const invalidJson = '{"name": "test", invalid}';
            const fallback = { error: "invalid" };
            const result = safeJsonParse(invalidJson, fallback);

            expect(result).toEqual(fallback);
        });

        it("should handle empty string", () => {
            const result = safeJsonParse("", { empty: true });
            expect(result).toEqual({ empty: true });
        });

        it("should parse arrays", () => {
            const json = "[1, 2, 3]";
            const result = safeJsonParse(json, []);

            expect(result).toEqual([1, 2, 3]);
        });
    });

    describe("debounce", () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("should debounce function calls", () => {
            const fn = vi.fn();
            const debouncedFn = debounce(fn, 100);

            debouncedFn("arg1");
            debouncedFn("arg2");
            debouncedFn("arg3");

            expect(fn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(100);

            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn).toHaveBeenCalledWith("arg3");
        });

        it("should handle multiple argument types", () => {
            const fn = vi.fn();
            const debouncedFn = debounce(fn, 50);

            debouncedFn(1, "string", { obj: true }, [1, 2, 3]);
            vi.advanceTimersByTime(50);

            expect(fn).toHaveBeenCalledWith(1, "string", { obj: true }, [1, 2, 3]);
        });

        it("should reset timer on subsequent calls", () => {
            const fn = vi.fn();
            const debouncedFn = debounce(fn, 100);

            debouncedFn("first");
            vi.advanceTimersByTime(50);
            debouncedFn("second");
            vi.advanceTimersByTime(50);

            expect(fn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(50);
            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn).toHaveBeenCalledWith("second");
        });
    });

    describe("assertNever", () => {
        it("should throw error with unexpected value", () => {
            expect(() => assertNever("unexpected" as never)).toThrow('Unexpected value: "unexpected"');
        });

        it("should handle complex objects", () => {
            const obj = { complex: "object", with: ["nested", "values"] };
            expect(() => assertNever(obj as never)).toThrow(`Unexpected value: ${JSON.stringify(obj)}`);
        });
    });

    describe("loadPluginComponent", () => {
        const mockComponent = () => null;

        it("should load component from core plugin", async () => {
            const plugin: DevToolPlugin = {
                name: "core-plugin",
                version: "1.0.0",
                kind: "core",
                contract: { namespace: "core", procedures: {} },
                exports: {
                    components: {
                        TestComponent: vi.fn().mockResolvedValue(mockComponent),
                    },
                },
                meta: { description: "Core plugin" },
            };

            const result = await loadPluginComponent(plugin, "TestComponent");
            expect(result).toBe(mockComponent);
            expect(plugin.exports.components!.TestComponent).toHaveBeenCalled();
        });

        it("should load component from module plugin", async () => {
            const plugin: DevToolPlugin = {
                name: "module-plugin",
                version: "1.0.0",
                kind: "module",
                contract: { namespace: "module", procedures: {} },
                exports: {
                    components: {
                        TestComponent: vi.fn().mockResolvedValue(mockComponent),
                    },
                },
                meta: { description: "Module plugin" },
            };

            const result = await loadPluginComponent(plugin, "TestComponent");
            expect(result).toBe(mockComponent);
        });

        it("should return null for non-existent component", async () => {
            const plugin: DevToolPlugin = {
                name: "test-plugin",
                version: "1.0.0",
                kind: "core",
                contract: { namespace: "test", procedures: {} },
                exports: {
                    components: {},
                },
                meta: { description: "Test plugin" },
            };

            const result = await loadPluginComponent(plugin, "NonExistentComponent");
            expect(result).toBeNull();
        });

        it("should handle loading errors gracefully", async () => {
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            const plugin: DevToolPlugin = {
                name: "error-plugin",
                version: "1.0.0",
                kind: "core",
                contract: { namespace: "error", procedures: {} },
                exports: {
                    components: {
                        ErrorComponent: vi.fn().mockRejectedValue(new Error("Load failed")),
                    },
                },
                meta: { description: "Error plugin" },
            };

            const result = await loadPluginComponent(plugin, "ErrorComponent");

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith("Failed to load component ErrorComponent from plugin error-plugin:", expect.any(Error));

            consoleSpy.mockRestore();
        });

        it("should return null for plugins without components export", async () => {
            const plugin: DevToolPlugin = {
                name: "no-components",
                version: "1.0.0",
                kind: "module",
                contract: { namespace: "none", procedures: {} },
                exports: {},
                meta: { description: "No components plugin" },
            };

            const result = await loadPluginComponent(plugin, "AnyComponent");
            expect(result).toBeNull();
        });
    });
});

describe("assertNever", () => {
    it("should throw error with unexpected value", () => {
        expect(() => assertNever("unexpected" as never)).toThrow('Unexpected value: "unexpected"');
    });

    it("should handle complex objects", () => {
        const obj = { complex: "object", with: ["nested", "values"] };
        expect(() => assertNever(obj as never)).toThrow(`Unexpected value: ${JSON.stringify(obj)}`);
    });
});

describe("loadPluginComponent", () => {
    const mockComponent = () => null;

    it("should load component from core plugin", async () => {
        const plugin: DevToolPlugin = {
            name: "core-plugin",
            version: "1.0.0",
            kind: "core",
            contract: { namespace: "core", procedures: {} },
            exports: {
                components: {
                    TestComponent: vi.fn().mockResolvedValue(mockComponent),
                },
            },
            meta: { description: "Core plugin" },
        };

        const result = await loadPluginComponent(plugin, "TestComponent");
        expect(result).toBe(mockComponent);
        expect(plugin.exports.components!.TestComponent).toHaveBeenCalled();
    });
});
