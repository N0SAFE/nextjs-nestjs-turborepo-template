/**
 * Global Context Registry Service Tests
 *
 * Comprehensive tests for the GlobalContextRegistryService
 * covering route, plugin, feature, and hook registration
 * along with the subscription system.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GlobalContextRegistryService } from "../global-context-registry.service";
import type {
  RouteRegistration,
  PluginRegistration,
  FeatureRegistration,
  HookRegistration,
  HookType,
} from "@/types/generator.types";

describe("GlobalContextRegistryService", () => {
  let service: GlobalContextRegistryService;

  beforeEach(() => {
    service = new GlobalContextRegistryService();
  });

  afterEach(() => {
    service.reset();
  });

  // ==========================================================================
  // Route Registration Tests
  // ==========================================================================
  describe("Route Registration", () => {
    // Routes without pluginId - service will add it
    const sampleRoutes: Omit<RouteRegistration, "pluginId">[] = [
      {
        path: "/api/users",
        method: "GET",
        handler: "getUsers",
        tags: ["users"],
        entity: "User",
      },
      {
        path: "/api/users/:id",
        method: "GET",
        handler: "getUserById",
        tags: ["users"],
        entity: "User",
      },
      {
        path: "/api/users",
        method: "POST",
        handler: "createUser",
        tags: ["users"],
        entity: "User",
        permissions: ["admin", "moderator"],
      },
      {
        path: "/api/posts",
        method: "GET",
        handler: "getPosts",
        tags: ["posts", "content"],
        entity: "Post",
        contract: "packages/contracts/api/src/routes/post.ts",
      },
    ];

    it("should register routes successfully", () => {
      service.registerRoutes("test-generator", sampleRoutes);
      const routes = service.getAllRoutes();
      expect(routes).toHaveLength(4);
    });

    it("should retrieve routes by entity", () => {
      service.registerRoutes("test-generator", sampleRoutes);
      const userRoutes = service.getRoutesByEntity("User");
      expect(userRoutes).toHaveLength(3);
      userRoutes.forEach((route) => {
        expect(route.entity).toBe("User");
      });
    });

    it("should retrieve routes by tag", () => {
      service.registerRoutes("test-generator", sampleRoutes);
      const postRoutes = service.getRoutesByTag("posts");
      expect(postRoutes).toHaveLength(1);
      expect(postRoutes[0]?.entity).toBe("Post");
    });

    it("should retrieve routes by multiple tags", () => {
      service.registerRoutes("test-generator", sampleRoutes);
      const userRoutes = service.getRoutesByTag("users");
      const contentRoutes = service.getRoutesByTag("content");
      expect(userRoutes).toHaveLength(3);
      expect(contentRoutes).toHaveLength(1);
    });

    it("should unregister routes by generator ID", () => {
      service.registerRoutes("generator-a", sampleRoutes.slice(0, 2));
      service.registerRoutes("generator-b", sampleRoutes.slice(2));
      
      expect(service.getAllRoutes()).toHaveLength(4);
      
      service.unregisterRoutes("generator-a");
      
      const remaining = service.getAllRoutes();
      expect(remaining).toHaveLength(2);
      expect(remaining[0]?.entity).toBe("User"); // POST /users
      expect(remaining[1]?.entity).toBe("Post"); // GET /posts
    });

    it("should handle duplicate route registrations gracefully", () => {
      service.registerRoutes("generator-a", [sampleRoutes[0]!]);
      service.registerRoutes("generator-b", [sampleRoutes[0]!]); // Same route
      
      const routes = service.getAllRoutes();
      expect(routes).toHaveLength(2); // Both registered (different generators)
    });

    it("should return empty array when no routes match entity", () => {
      service.registerRoutes("test-generator", sampleRoutes);
      const routes = service.getRoutesByEntity("NonExistent");
      expect(routes).toEqual([]);
    });

    it("should return empty array when no routes match tag", () => {
      service.registerRoutes("test-generator", sampleRoutes);
      const routes = service.getRoutesByTag("nonexistent-tag");
      expect(routes).toEqual([]);
    });
  });

  // ==========================================================================
  // Plugin Registration Tests
  // ==========================================================================
  describe("Plugin Registration", () => {
    it("should register plugins successfully", () => {
      service.registerPlugin("orpc", {
        version: "1.0.0",
        type: "api",
        provides: ["type-safe-api", "contract-generation", "validation"],
      });
      service.registerPlugin("better-auth", {
        version: "1.0.0",
        type: "auth",
        provides: ["authentication", "session-management", "oauth"],
        requires: ["database"],
      });
      
      expect(service.hasPlugin("orpc")).toBe(true);
      expect(service.hasPlugin("better-auth")).toBe(true);
      expect(service.hasPlugin("nonexistent")).toBe(false);
    });

    it("should check feature providers", () => {
      service.registerPlugin("orpc", {
        version: "1.0.0",
        type: "api",
        provides: ["type-safe-api", "contract-generation"],
      });
      service.registerPlugin("better-auth", {
        version: "1.0.0",
        type: "auth",
        provides: ["authentication", "session-management"],
      });
      service.registerPlugin("drizzle", {
        version: "1.0.0",
        type: "database",
        provides: ["database", "orm", "migrations"],
      });
      
      expect(service.hasFeatureProvider("type-safe-api")).toBe(true);
      expect(service.hasFeatureProvider("authentication")).toBe(true);
      expect(service.hasFeatureProvider("database")).toBe(true);
      expect(service.hasFeatureProvider("nonexistent-feature")).toBe(false);
    });

    it("should get plugins by type", () => {
      service.registerPlugin("orpc", {
        version: "1.0.0",
        type: "api",
        provides: ["type-safe-api"],
      });
      service.registerPlugin("better-auth", {
        version: "1.0.0",
        type: "auth",
        provides: ["authentication"],
      });
      service.registerPlugin("drizzle", {
        version: "1.0.0",
        type: "database",
        provides: ["database"],
      });
      
      const authPlugins = service.getPluginsByType("auth");
      expect(authPlugins).toHaveLength(1);
      expect(authPlugins[0]?.pluginId).toBe("better-auth");
      
      const dbPlugins = service.getPluginsByType("database");
      expect(dbPlugins).toHaveLength(1);
      expect(dbPlugins[0]?.pluginId).toBe("drizzle");
    });

    it("should unregister plugins", () => {
      service.registerPlugin("orpc", {
        version: "1.0.0",
        type: "api",
        provides: ["type-safe-api"],
      });
      
      expect(service.hasPlugin("orpc")).toBe(true);
      service.unregisterPlugin("orpc");
      expect(service.hasPlugin("orpc")).toBe(false);
      
      // Feature provider should also be gone
      expect(service.hasFeatureProvider("type-safe-api")).toBe(false);
    });

    it("should handle plugin registration with minimal data", () => {
      service.registerPlugin("minimal", {
        version: "1.0.0",
        type: "utility",
        provides: [],
      });
      
      expect(service.hasPlugin("minimal")).toBe(true);
    });
    
    it("should get plugin by ID", () => {
      service.registerPlugin("orpc", {
        version: "1.0.0",
        type: "api",
        provides: ["type-safe-api"],
      });

      const plugin = service.getPlugin("orpc");
      expect(plugin).toBeDefined();
      expect(plugin?.pluginId).toBe("orpc");
      expect(plugin?.version).toBe("1.0.0");
      expect(plugin?.type).toBe("api");
    });
    
    it("should get all plugins", () => {
      service.registerPlugin("orpc", {
        version: "1.0.0",
        type: "api",
        provides: ["type-safe-api"],
      });
      service.registerPlugin("drizzle", {
        version: "1.0.0",
        type: "database",
        provides: ["database"],
      });

      const allPlugins = service.getAllPlugins();
      expect(allPlugins).toHaveLength(2);
    });
  });

  // ==========================================================================
  // Feature Registration Tests
  // ==========================================================================
  describe("Feature Registration", () => {
    const sampleFeatures: Omit<FeatureRegistration, "pluginId">[] = [
      {
        featureId: "user-crud",
        category: "api-endpoint",
        files: ["apps/api/src/modules/user/user.controller.ts", "apps/api/src/modules/user/user.service.ts"],
        description: "User CRUD Operations",
        metadata: { entity: "User", hasAuth: true },
      },
      {
        featureId: "auth-middleware",
        category: "middleware",
        files: ["apps/api/src/middleware/auth.middleware.ts"],
        description: "Authentication Middleware",
        dependencies: ["user-crud"],
      },
      {
        featureId: "user-list-page",
        category: "ui-component",
        files: ["apps/web/src/pages/users/index.tsx"],
        description: "User List Page",
        dependencies: ["user-crud"],
      },
      {
        featureId: "api-client",
        category: "utility",
        files: ["apps/web/src/lib/api-client.ts"],
        description: "API Client Generation",
      },
    ];

    it("should register features successfully", () => {
      service.registerFeatures("test-generator", sampleFeatures);
      const allFeatures = service.getAllFeatures();
      expect(allFeatures).toHaveLength(4);
    });

    it("should get features by category", () => {
      service.registerFeatures("test-generator", sampleFeatures);
      
      const apiFeatures = service.getFeaturesByCategory("api-endpoint");
      expect(apiFeatures).toHaveLength(1);
      
      const middlewareFeatures = service.getFeaturesByCategory("middleware");
      expect(middlewareFeatures).toHaveLength(1);
      
      const uiFeatures = service.getFeaturesByCategory("ui-component");
      expect(uiFeatures).toHaveLength(1);
    });

    it("should get feature by ID", () => {
      service.registerFeatures("test-generator", sampleFeatures);
      
      const allFeatures = service.getAllFeatures();
      const feature = allFeatures.find((f) => f.featureId === "user-crud");
      expect(feature).toBeDefined();
      expect(feature?.description).toBe("User CRUD Operations");
      expect(feature?.metadata?.entity).toBe("User");
    });

    it("should return undefined for non-existent feature ID", () => {
      service.registerFeatures("test-generator", sampleFeatures);
      const allFeatures = service.getAllFeatures();
      const feature = allFeatures.find((f) => f.featureId === "nonexistent");
      expect(feature).toBeUndefined();
    });

    it("should unregister features by plugin ID", () => {
      service.registerFeatures("generator-a", sampleFeatures.slice(0, 2));
      service.registerFeatures("generator-b", sampleFeatures.slice(2));
      
      expect(service.getAllFeatures()).toHaveLength(4);
      
      service.unregisterFeatures("generator-a");
      
      expect(service.getAllFeatures()).toHaveLength(2);
    });
  });

  // ==========================================================================
  // Hook Registration Tests
  // ==========================================================================
  describe("Hook Registration", () => {
    const sampleHooks: Omit<HookRegistration, "pluginId">[] = [
      {
        name: "useUsers",
        type: "query",
        entity: "User",
        description: "Fetch users",
      },
      {
        name: "useCreateUser",
        type: "mutation",
        entity: "User",
        description: "Create a user",
      },
      {
        name: "usePosts",
        type: "query",
        entity: "Post",
        description: "Fetch posts",
      },
      {
        name: "useInfiniteUsers",
        type: "infinite-query",
        entity: "User",
        description: "Infinite scroll users",
      },
    ];

    it("should register hooks successfully", () => {
      service.registerHooks("test-generator", sampleHooks);
      const hooks = service.getAllHooks();
      expect(hooks).toHaveLength(4);
    });

    it("should get hooks by entity", () => {
      service.registerHooks("test-generator", sampleHooks);
      
      const userHooks = service.getHooksByEntity("User");
      expect(userHooks).toHaveLength(3);
      
      const postHooks = service.getHooksByEntity("Post");
      expect(postHooks).toHaveLength(1);
    });

    it("should get hooks by type", () => {
      service.registerHooks("test-generator", sampleHooks);
      
      const queryHooks = service.getHooksByType("query");
      expect(queryHooks).toHaveLength(2);
      
      const mutationHooks = service.getHooksByType("mutation");
      expect(mutationHooks).toHaveLength(1);
      
      const infiniteHooks = service.getHooksByType("infinite-query");
      expect(infiniteHooks).toHaveLength(1);
    });

    it("should unregister hooks by plugin ID", () => {
      service.registerHooks("generator-a", sampleHooks.slice(0, 2));
      service.registerHooks("generator-b", sampleHooks.slice(2));
      
      expect(service.getAllHooks()).toHaveLength(4);
      
      service.unregisterHooks("generator-a");
      
      expect(service.getAllHooks()).toHaveLength(2);
    });
  });

  // ==========================================================================
  // Subscription System Tests
  // ==========================================================================
  describe("Subscription System", () => {
    it("should notify subscribers when routes are registered", () => {
      const callback = vi.fn();
      service.subscribeToRoutes("subscriber-1", callback);
      
      const routes: Omit<RouteRegistration, "pluginId">[] = [
        {
          path: "/api/test",
          method: "GET",
          handler: "test",
          tags: ["test"],
        },
      ];
      
      service.registerRoutes("test-generator", routes);
      
      expect(callback).toHaveBeenCalledTimes(1);
      // Callback receives (items, added, removed)
      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ path: "/api/test" })]),
        expect.arrayContaining([expect.objectContaining({ path: "/api/test" })]),
        []
      );
    });

    it("should notify subscribers when plugins are registered", () => {
      const callback = vi.fn();
      service.subscribeToPlugins("subscriber-1", callback);
      
      service.registerPlugin("test", {
        version: "1.0.0",
        type: "utility",
        provides: [],
      });
      
      expect(callback).toHaveBeenCalledTimes(1);
      // Callback receives (items, added, removed)
      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ pluginId: "test" })]),
        expect.arrayContaining([expect.objectContaining({ pluginId: "test" })]),
        []
      );
    });

    it("should notify subscribers when features are registered", () => {
      const callback = vi.fn();
      service.subscribeToFeatures("subscriber-1", callback);
      
      const features: Omit<FeatureRegistration, "pluginId">[] = [
        {
          featureId: "test-feature",
          category: "utility",
          files: ["test.ts"],
          description: "Test Feature",
        },
      ];
      
      service.registerFeatures("test-generator", features);
      
      expect(callback).toHaveBeenCalledTimes(1);
      // Callback receives (items, added, removed)
      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ featureId: "test-feature" })]),
        expect.arrayContaining([expect.objectContaining({ featureId: "test-feature" })]),
        []
      );
    });

    it("should notify subscribers when hooks are registered", () => {
      const callback = vi.fn();
      service.subscribeToHooks("subscriber-1", callback);
      
      const hooks: Omit<HookRegistration, "pluginId">[] = [
        {
          name: "useTest",
          type: "query",
          entity: "Test",
        },
      ];
      
      service.registerHooks("test-generator", hooks);
      
      expect(callback).toHaveBeenCalledTimes(1);
      // Callback receives (items, added, removed)
      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ name: "useTest" })]),
        expect.arrayContaining([expect.objectContaining({ name: "useTest" })]),
        []
      );
    });

    it("should allow unsubscription", () => {
      const callback = vi.fn();
      const subscription = service.subscribeToRoutes("subscriber-1", callback);
      
      const routes: Omit<RouteRegistration, "pluginId">[] = [
        {
          path: "/api/test",
          method: "GET",
          handler: "test",
          tags: ["test"],
        },
      ];
      
      service.registerRoutes("test-generator-1", routes);
      expect(callback).toHaveBeenCalledTimes(1);
      
      subscription.unsubscribe();
      
      service.registerRoutes("test-generator-2", routes);
      expect(callback).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it("should support multiple subscribers", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      service.subscribeToRoutes("subscriber-1", callback1);
      service.subscribeToRoutes("subscriber-2", callback2);
      
      const routes: Omit<RouteRegistration, "pluginId">[] = [
        {
          path: "/api/test",
          method: "GET",
          handler: "test",
          tags: ["test"],
        },
      ];
      
      service.registerRoutes("test-generator", routes);
      
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("should report subscription counts", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      service.subscribeToRoutes("subscriber-1", callback1);
      service.subscribeToRoutes("subscriber-2", callback2);
      service.subscribeToPlugins("subscriber-1", callback1);
      
      const counts = service.getSubscriptionCounts();
      expect(counts.routes).toBe(2);
      expect(counts.plugins).toBe(1);
      expect(counts.features).toBe(0);
      expect(counts.hooks).toBe(0);
    });
  });

  // ==========================================================================
  // Snapshot and Reset Tests
  // ==========================================================================
  describe("Snapshot and Reset", () => {
    it("should create accurate snapshot", () => {
      // Register some data
      service.registerRoutes("test", [
        {
          path: "/api/test",
          method: "GET",
          handler: "test",
          tags: ["test"],
        },
      ]);
      
      service.registerPlugin("test-plugin", {
        version: "1.0.0",
        type: "utility",
        provides: [],
      });
      
      service.registerFeatures("test", [
        {
          featureId: "test-feature",
          category: "utility",
          files: ["test.ts"],
          description: "Test Feature",
        },
      ]);
      
      service.registerHooks("test", [
        {
          name: "useTest",
          type: "query",
          entity: "Test",
        },
      ]);
      
      const snapshot = service.getSnapshot();
      
      expect(snapshot.routes).toHaveLength(1);
      expect(snapshot.plugins).toHaveLength(1);
      expect(snapshot.features).toHaveLength(1);
      expect(snapshot.hooks).toHaveLength(1);
      expect(snapshot.timestamp).toBeDefined();
    });

    it("should reset all data", () => {
      // Register some data
      service.registerRoutes("test", [
        {
          path: "/api/test",
          method: "GET",
          handler: "test",
          tags: ["test"],
        },
      ]);
      
      service.registerPlugin("test-plugin", {
        version: "1.0.0",
        type: "utility",
        provides: [],
      });
      
      // Subscribe
      const callback = vi.fn();
      service.subscribeToRoutes("subscriber-1", callback);
      
      // Reset
      service.reset();
      
      // Verify data is cleared
      expect(service.getAllRoutes()).toHaveLength(0);
      expect(service.hasPlugin("test-plugin")).toBe(false);
      expect(service.getAllFeatures()).toHaveLength(0);
      expect(service.getAllHooks()).toHaveLength(0);
      
      // Note: Subscriptions are NOT cleared on reset (intentional)
      // They represent ongoing interest in changes, not the data itself
      const counts = service.getSubscriptionCounts();
      expect(counts.routes).toBe(1); // Subscription still active
    });
  });

  // ==========================================================================
  // Event Log Tests
  // ==========================================================================
  describe("Event Log", () => {
    it("should track registration events", () => {
      service.registerRoutes("test", [
        {
          path: "/api/test",
          method: "GET",
          handler: "test",
          tags: ["test"],
        },
      ]);
      
      service.registerPlugin("test-plugin", {
        version: "1.0.0",
        type: "utility",
        provides: [],
      });
      
      const log = service.getEventLog();
      
      expect(log.length).toBeGreaterThanOrEqual(2);
      
      const routeEvent = log.find((e) => e.type === "route-added");
      expect(routeEvent).toBeDefined();
      
      const pluginEvent = log.find((e) => e.type === "plugin-added");
      expect(pluginEvent).toBeDefined();
    });

    it("should track unregistration events", () => {
      service.registerRoutes("test-generator", [
        {
          path: "/api/test",
          method: "GET",
          handler: "test",
          tags: ["test"],
        },
      ]);
      
      service.unregisterRoutes("test-generator");
      
      const log = service.getEventLog();
      const unregisterEvent = log.find((e) => e.type === "route-removed");
      expect(unregisterEvent).toBeDefined();
    });

    it("should clear event log on reset but log the reset event", () => {
      service.registerRoutes("test", [
        {
          path: "/api/test",
          method: "GET",
          handler: "test",
          tags: ["test"],
        },
      ]);
      
      expect(service.getEventLog().length).toBeGreaterThan(0);
      
      service.reset();
      
      // Event log is cleared but a snapshot-reset event is logged for debugging
      const log = service.getEventLog();
      expect(log).toHaveLength(1);
      expect(log[0]?.type).toBe("snapshot-reset");
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe("Edge Cases", () => {
    it("should handle empty arrays gracefully", () => {
      service.registerRoutes("test", []);
      service.registerFeatures("test", []);
      service.registerHooks("test", []);
      
      expect(service.getAllRoutes()).toHaveLength(0);
      expect(service.getAllFeatures()).toHaveLength(0);
      expect(service.getAllHooks()).toHaveLength(0);
    });

    it("should handle unregistering non-existent generators", () => {
      // Should not throw
      expect(() => service.unregisterRoutes("nonexistent")).not.toThrow();
      expect(() => service.unregisterFeatures("nonexistent")).not.toThrow();
      expect(() => service.unregisterHooks("nonexistent")).not.toThrow();
      expect(() => service.unregisterPlugin("nonexistent")).not.toThrow();
    });

    it("should handle special characters in entity names", () => {
      service.registerRoutes("test", [
        {
          path: "/api/user-roles",
          method: "GET",
          handler: "getUserRoles",
          tags: ["user-roles"],
          entity: "UserRole", // PascalCase
        },
      ]);
      
      const routes = service.getRoutesByEntity("UserRole");
      expect(routes).toHaveLength(1);
    });

    it("should handle routes without optional fields", () => {
      service.registerRoutes("test", [
        {
          path: "/api/minimal",
          method: "GET",
          handler: "minimal",
          tags: [],
          // No entity, no permissions, no contract
        },
      ]);
      
      const routes = service.getAllRoutes();
      expect(routes).toHaveLength(1);
      expect(routes[0]?.entity).toBeUndefined();
    });
  });

  // ==========================================================================
  // Integration Scenarios
  // ==========================================================================
  describe("Integration Scenarios", () => {
    it("should support entity-hooks generator workflow", () => {
      // Simulate CRUD generator registering routes
      const crudRoutes: Omit<RouteRegistration, "pluginId">[] = [
        { path: "/api/users", method: "GET", handler: "getUsers", tags: ["users"], entity: "User" },
        { path: "/api/users/:id", method: "GET", handler: "getUserById", tags: ["users"], entity: "User" },
        { path: "/api/users", method: "POST", handler: "createUser", tags: ["users"], entity: "User" },
        { path: "/api/users/:id", method: "PUT", handler: "updateUser", tags: ["users"], entity: "User" },
        { path: "/api/users/:id", method: "DELETE", handler: "deleteUser", tags: ["users"], entity: "User" },
      ];
      
      // Entity-hooks generator subscribes to routes
      const detectedEntities: string[] = [];
      service.subscribeToRoutes("entity-hooks", (routes) => {
        routes.forEach((route) => {
          if (route.entity && !detectedEntities.includes(route.entity)) {
            detectedEntities.push(route.entity);
          }
        });
      });
      
      // CRUD generator runs and registers routes
      service.registerRoutes("nestjs-crud", crudRoutes);
      
      // Entity-hooks generator should have detected the User entity
      expect(detectedEntities).toContain("User");
      
      // Entity-hooks generator can now query routes for User
      const userRoutes = service.getRoutesByEntity("User");
      expect(userRoutes).toHaveLength(5);
      
      // Generate hooks based on routes
      const hookTypes = new Map([
        ["GET", "query"],
        ["POST", "mutation"],
        ["PUT", "mutation"],
        ["DELETE", "mutation"],
      ]);
      
      const generatedHooks: Omit<HookRegistration, "pluginId">[] = userRoutes.map((route) => ({
        name: `use${route.handler.charAt(0).toUpperCase()}${route.handler.slice(1)}`,
        type: (hookTypes.get(route.method) || "query") as HookType,
        entity: route.entity!,
      }));
      
      service.registerHooks("entity-hooks", generatedHooks);
      
      // Verify hooks were generated
      const userHooks = service.getHooksByEntity("User");
      expect(userHooks).toHaveLength(5);
    });

    it("should support plugin-aware generation workflow", () => {
      // Register ORPC plugin
      service.registerPlugin("orpc", {
        version: "1.0.0",
        type: "api",
        provides: ["type-safe-api", "contracts"],
      });
      
      // Generator checks for ORPC plugin
      const hasORPC = service.hasPlugin("orpc");
      const hasContracts = service.hasFeatureProvider("contracts");
      
      expect(hasORPC).toBe(true);
      expect(hasContracts).toBe(true);
      
      // Generator can adapt its output based on plugins
      if (hasORPC) {
        // Generate ORPC-specific code
        service.registerFeatures("nestjs-module", [
          {
            featureId: "user-orpc-router",
            category: "api-endpoint",
            files: ["user.router.ts"],
            description: "User ORPC Router",
            metadata: { framework: "orpc" },
          },
        ]);
      }
      
      const features = service.getFeaturesByCategory("api-endpoint");
      expect(features).toHaveLength(1);
      expect(features[0]?.metadata?.framework).toBe("orpc");
    });
  });
});
