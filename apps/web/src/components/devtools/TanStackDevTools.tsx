/* eslint-disable @typescript-eslint/no-unnecessary-condition */
"use client";

import React, { useState } from "react";
import {
  TanStackDevtools,
  type TanStackDevtoolsReactPlugin,
} from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { orpc } from "@/lib/orpc";
import { useQuery } from "@tanstack/react-query";
import { authClient, signOut, useSession } from "@/lib/auth";
import { logger } from "@repo/logger";
import {
  hasMasterTokenPlugin,
  MasterTokenProvider,
  useMasterToken,
} from "@repo/auth/client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@repo/ui/components/shadcn/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@repo/ui/components/shadcn/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@repo/ui/components/shadcn/command";
import { Button } from "@repo/ui/components/shadcn/button";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { Switch } from "@repo/ui/components/shadcn/switch";
import z from "zod/v4";

// Plugin Components
const ReactQueryPlugin: TanStackDevtoolsReactPlugin = {
  id: "react-query",
  name: "React Query",
  render: () => (
    <ReactQueryDevtoolsPanel style={{ height: "100%", width: "100%" }} />
  ),
};

// Routes Plugin Component
const RoutesPluginComponent = () => {
  const [loading, setLoading] = useState(false);
  const [routesList, setRoutesList] = useState<
    {
      path: string;
      name: string;
      type: "API" | "Page" | "Layout" | "Unknown";
      link?: React.ReactNode;
      hasParams: boolean;
      hasLayout: boolean;
      hasPage: boolean;
      isStatic: boolean;
      paramsList: string[];
    }[]
  >([]);
  const [routeStats, setRouteStats] = useState<{
    totalRoutes: number;
    apiRoutes: number;
    pageRoutes: number;
    layoutOnlyRoutes: number;
    staticRoutes: number;
    dynamicRoutes: number;
  }>({
    totalRoutes: 0,
    apiRoutes: 0,
    pageRoutes: 0,
    layoutOnlyRoutes: 0,
    staticRoutes: 0,
    dynamicRoutes: 0,
  });

  const fetchRoutesData = async () => {
    setLoading(true);
    try {
      const routesModule = await import("@/routes");

      const entries = Object.entries(routesModule) as [
        string,
        () => object | string | Promise<object | string>,
      ][];

      const list = await Promise.all(
        entries.map(async ([name, fnOrValue]) => {
          let path = "";
          let link: React.ReactNode | undefined;
          let hasParams = false;
          let hasLayout = false;
          let hasPage = false;
          let paramsList: string[] = [];

          if (typeof fnOrValue === "function") {
            // Check if the route has routeName property (indicating it's a route builder)
            const routeBuilder = fnOrValue as {
              routeName?: string;
              paramsSchema?: z.ZodObject<z.ZodRawShape> | z.ZodType;
              isLayoutOnly?: boolean;
              hasPage?: boolean;
              hasLayout?: boolean;
            };

            // Extract metadata
            hasLayout = routeBuilder.hasLayout ?? false;
            hasPage = routeBuilder.hasPage ?? false;

            // For routes with required params, extract param names and build proper path
            if (routeBuilder.routeName && routeBuilder.paramsSchema) {
              try {
                const schema = routeBuilder.paramsSchema;
                const paramsShape = schema.safeParse({});
                hasParams = !paramsShape.success;

                if (hasParams) {
                  const paramKeys: string[] = [];
                  try {
                    if ("shape" in schema) {
                      paramKeys.push(...Object.keys(schema.shape));
                    }
                  } catch {
                    // Fallback - parse from error message
                  }

                  paramsList = paramKeys;

                  // Try calling with empty params to get base path template
                  try {
                    const res = fnOrValue();
                    path = typeof res === "string" ? res : name;
                  } catch {
                    // Extract path from route name, replacing params with [param] format
                    path = name;
                    // Convert camelCase to path segments
                    path = path.replace(/([A-Z])/g, "/$1").toLowerCase();
                    path = path.replace(/^\//, "");
                    // Replace known param patterns
                    paramKeys.forEach((param) => {
                      const paramPattern = param.toLowerCase();
                      path = path.replace(
                        new RegExp(paramPattern, "g"),
                        `[${param}]`,
                      );
                    });
                    // Clean up common patterns
                    path =
                      "/" +
                      path
                        .replace(/^\/auth/, "/(auth)")
                        .replace(/^\/api/, "/api")
                        .replace(/^\/dashboard/, "/dashboard");
                  }
                } else {
                  // No params required, we can safely call it
                  const res = fnOrValue();
                  let awaited: unknown = res;
                  if (
                    res &&
                    typeof (
                      res as { then: (...args: unknown[]) => Promise<unknown> }
                    ).then === "function"
                  ) {
                    awaited = await res;
                  }
                  path = typeof awaited === "string" ? awaited : name;
                }
              } catch {
                // Fallback to name-based path
                path = `/${name.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
              }
            } else {
              // Not a route builder or no params schema, try calling it
              try {
                const res = fnOrValue();
                let awaited: unknown = res;
                if (
                  res &&
                  typeof (
                    res as { then: (...args: unknown[]) => Promise<unknown> }
                  ).then === "function"
                ) {
                  awaited = await res;
                }

                // If the helper returned a string, use it
                if (typeof awaited === "string") {
                  path = awaited;
                } else if (typeof awaited === "object" && awaited !== null) {
                  const obj = awaited as Record<string, unknown>;
                  // Common shapes: { path }, { url }, { href }, { to }, or a function getPath()
                  if ("path" in obj && typeof obj.path === "string") {
                    path = obj.path;
                  } else if ("url" in obj && typeof obj.url === "string") {
                    path = obj.url;
                  } else if ("href" in obj && typeof obj.href === "string") {
                    path = obj.href;
                  } else if ("to" in obj && typeof obj.to === "string") {
                    path = obj.to;
                  } else {
                    path = name;
                  }
                } else {
                  path = name;
                }
              } catch {
                // Silently handle validation errors for routes with required params
                path = `/${name.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
              }
            }

            // Check for Link property (don't try to render it for routes requiring params)
            const fnWithProps = fnOrValue as {
              Link?: React.FunctionComponent<Record<string, unknown>>;
              paramsSchema?: z.ZodType;
            };
            if (fnWithProps.Link && fnWithProps.paramsSchema) {
              try {
                const schema = fnWithProps.paramsSchema;
                if (
                  schema &&
                  typeof schema === "object" &&
                  "safeParse" in schema
                ) {
                  const paramsShape = schema.safeParse({});
                  // Only render Link if params validation passes (no required params)
                  if (
                    paramsShape &&
                    typeof paramsShape === "object" &&
                    "success" in paramsShape &&
                    paramsShape.success
                  ) {
                    link = React.createElement(fnWithProps.Link, {}, "🔗");
                  }
                }
              } catch {
                // Ignore - route requires params
              }
            } else if (fnWithProps.Link) {
              link = React.createElement(fnWithProps.Link, {}, "🔗");
            }
          } else if (typeof fnOrValue === "string") {
            path = fnOrValue;
          } else {
            path = name;
          }

          const type: "API" | "Page" | "Layout" | "Unknown" =
            name.toLowerCase().startsWith("getapi") ||
            name.toLowerCase().startsWith("api") ||
            path.startsWith("/api")
              ? "API"
              : hasLayout && !hasPage
                ? "Layout"
                : path.startsWith("/")
                  ? "Page"
                  : "Unknown";

          const isStatic =
            !hasParams && path.startsWith("/") && !path.includes("[");

          return {
            name,
            path,
            type,
            link,
            hasParams,
            hasLayout,
            hasPage,
            isStatic,
            paramsList,
          };
        }),
      );

      const filtered = list.filter((r) => !r.name.startsWith("__"));
      filtered.sort((a, b) => a.path.localeCompare(b.path));

      const stats = {
        totalRoutes: filtered.length,
        apiRoutes: filtered.filter((r) => r.type === "API").length,
        pageRoutes: filtered.filter((r) => r.type === "Page").length,
        layoutOnlyRoutes: filtered.filter((r) => r.type === "Layout").length,
        staticRoutes: filtered.filter((r) => r.isStatic).length,
        dynamicRoutes: filtered.filter((r) => r.hasParams).length,
      };

      setRoutesList(filtered);
      setRouteStats(stats);
    } catch (error) {
      logger.error("Failed to load routes module", { error });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    void fetchRoutesData();
  }, []);

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-lg font-semibold">Route Statistics</h3>
        {loading ? (
          <div>Loading route statistics...</div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded bg-blue-50 p-3 dark:bg-blue-900/20">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {routeStats.totalRoutes}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Total Routes
              </div>
            </div>
            <div className="rounded bg-green-50 p-3 dark:bg-green-900/20">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {routeStats.pageRoutes}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Pages
              </div>
            </div>
            <div className="rounded bg-purple-50 p-3 dark:bg-purple-900/20">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {routeStats.apiRoutes}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                API Routes
              </div>
            </div>
            <div className="rounded bg-orange-50 p-3 dark:bg-orange-900/20">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {routeStats.layoutOnlyRoutes}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Layout Only
              </div>
            </div>
            <div className="rounded bg-cyan-50 p-3 dark:bg-cyan-900/20">
              <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                {routeStats.staticRoutes}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Static
              </div>
            </div>
            <div className="rounded bg-pink-50 p-3 dark:bg-pink-900/20">
              <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {routeStats.dynamicRoutes}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Dynamic
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-lg font-semibold">All Routes</h3>
        <div className="max-h-125 overflow-y-auto">
          {loading ? (
            <div>Loading routes...</div>
          ) : routesList.length ? (
            <div className="space-y-1">
              {routesList.map((route, index) => (
                <div
                  key={index}
                  className="group rounded border border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                          {route.path}
                        </span>
                        {route.isStatic && (
                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Static
                          </span>
                        )}
                        {route.hasParams && (
                          <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                            Dynamic
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-mono">{route.name}</span>
                        {route.paramsList.length > 0 && (
                          <span className="text-xs text-gray-400">
                            Params: {route.paramsList.join(", ")}
                          </span>
                        )}
                      </div>
                      {(route.hasLayout || route.hasPage) && (
                        <div className="flex gap-1">
                          {route.hasPage && (
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                              Page
                            </span>
                          )}
                          {route.hasLayout && (
                            <span className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                              Layout
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {route.link && (
                        <div className="cursor-pointer transition-transform hover:scale-110">
                          {route.link}
                        </div>
                      )}
                      <span
                        className={
                          route.type === "API"
                            ? "rounded bg-purple-100 px-2 py-1 text-xs font-medium dark:bg-purple-900"
                            : route.type === "Page"
                              ? "rounded bg-blue-100 px-2 py-1 text-xs font-medium dark:bg-blue-900"
                              : route.type === "Layout"
                                ? "rounded bg-orange-100 px-2 py-1 text-xs font-medium dark:bg-orange-900"
                                : "rounded bg-gray-100 px-2 py-1 text-xs font-medium dark:bg-gray-700"
                        }
                      >
                        {route.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>No routes available</div>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          void fetchRoutesData();
        }}
        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        disabled={loading}
      >
        {loading ? "Refreshing..." : "Refresh Routes"}
      </button>
    </div>
  );
};

const RoutesPlugin: TanStackDevtoolsReactPlugin = {
  id: "routes",
  name: "🗺️ Routes",
  render: () => <RoutesPluginComponent />,
};

// Bundles Plugin Component
const BundlesPluginComponent = () => {
  const [bundleInfo, setBundleInfo] = useState<{
    buildTime: string;
    environment: "development" | "production" | "test";
    nextjsVersion: string;
    nodeVersion: string;
  }>({
    buildTime: "",
    environment: "development",
    nextjsVersion: "",
    nodeVersion: "",
  });
  const [loading, setLoading] = useState(false);

  const fetchBundleInfo = () => {
    setLoading(true);
    try {
      // Mock data for now - will be replaced with actual API calls
      const mockBundleInfo = {
        buildTime: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        nextjsVersion: "15.4.0",
        nodeVersion: process.version || "18.0.0",
      };

      setTimeout(() => {
        setBundleInfo(mockBundleInfo);
        setLoading(false);
      }, 800);
    } catch (error) {
      logger.error("Failed to fetch bundle info", { error });
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchBundleInfo();
  }, []);

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 text-lg font-semibold">Bundle Information</h3>
        {loading ? (
          <div>Loading bundle information...</div>
        ) : bundleInfo ? (
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium">Build Time:</span>
              <span className="ml-2">
                {new Date(bundleInfo.buildTime).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Environment:</span>
              <span className="ml-2">{bundleInfo.environment}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Next.js Version:</span>
              <span className="ml-2">{bundleInfo.nextjsVersion}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Node Version:</span>
              <span className="ml-2">{bundleInfo.nodeVersion}</span>
            </div>
          </div>
        ) : (
          <div>No bundle information available</div>
        )}
      </div>

      <button
        onClick={() => {
          fetchBundleInfo();
        }}
        className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        disabled={loading}
      >
        {loading ? "Refreshing..." : "Refresh Bundle Info"}
      </button>
    </div>
  );
};

const BundlesPlugin: TanStackDevtoolsReactPlugin = {
  id: "bundles",
  name: "📦 Bundles",
  render: () => <BundlesPluginComponent />,
};

// CLI Plugin Component
const CLIPluginComponent = () => {
  const [envInfo, setEnvInfo] = useState<{
    platform: "MacIntel" | "Win32" | "Linux x86_64";
    arch: string;
    nodeVersion: string;
    cpuUsage: number;
    uptime: number;
  }>({
    platform: "MacIntel",
    arch: "x64",
    nodeVersion: "14.17.0",
    cpuUsage: 0,
    uptime: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchEnvInfo = () => {
    setLoading(true);
    try {
      // Get actual browser environment info
      const mockEnvInfo = {
        platform: navigator.platform || "Unknown",
        arch: "Browser",
        nodeVersion: "N/A (Browser)",
        cpuUsage: Math.random() * 20, // Mock CPU usage
        uptime: performance.now() / 1000, // Uptime in seconds
      };

      setTimeout(() => {
        setEnvInfo(mockEnvInfo);
        setLoading(false);
      }, 600);
    } catch (error) {
      logger.error("Failed to fetch environment info", { error });
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchEnvInfo();
  }, []);

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 text-lg font-semibold">Environment Information</h3>
        {loading ? (
          <div>Loading environment information...</div>
        ) : envInfo ? (
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium">Platform:</span>
              <span className="ml-2">{envInfo.platform}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Architecture:</span>
              <span className="ml-2">{envInfo.arch}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Node Version:</span>
              <span className="ml-2">{envInfo.nodeVersion}</span>
            </div>
            <div>
              <span className="text-sm font-medium">CPU Usage:</span>
              <span className="ml-2">{envInfo.cpuUsage?.toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-sm font-medium">Uptime:</span>
              <span className="ml-2">
                {Math.round(envInfo.uptime / 60)} minutes
              </span>
            </div>
          </div>
        ) : (
          <div>No environment information available</div>
        )}
      </div>

      <button
        onClick={() => {
          fetchEnvInfo();
        }}
        className="rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
        disabled={loading}
      >
        {loading ? "Refreshing..." : "Refresh Environment"}
      </button>
    </div>
  );
};

const CLIPlugin: TanStackDevtoolsReactPlugin = {
  id: "cli",
  name: "⚡ CLI",
  render: () => <CLIPluginComponent />,
};

// Auth Plugin Component
const AuthPluginComponent = () => {
  return (
    <div className="space-y-4 p-4">
      {hasMasterTokenPlugin(authClient) ? (
        <ConfiguredAuth />
      ) : (
        <div className="p-4">Auth client not configured</div>
      )}
    </div>
  );
};

const ConfiguredAuth = () => {
  const { enabled: devAuthEnabled, setEnabled } = useMasterToken();
  const devAuthKey = process.env.NEXT_PUBLIC_DEV_AUTH_KEY?.trim();
  const devAuthBearerHeader = devAuthKey
    ? { Authorization: `Bearer ${devAuthKey}` }
    : undefined;
  const devAuthHeaders =
    devAuthEnabled && devAuthKey
      ? { Authorization: `Bearer ${devAuthKey}` }
      : undefined;
  const [authConfig, setAuthConfig] = useState<{
    databaseUrl: string;
    baseUrl: string;
    secret: string;
    trustHost: boolean;
  }>({
    databaseUrl: "Not configured",
    baseUrl:
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000",
    secret: "configured",
    trustHost: true,
  });
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [switchingUserId, setSwitchingUserId] = useState<string | null>(null);
  const [switchMessage, setSwitchMessage] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  // Search term for filtering users (driven by the UserSelector's Command input)
  const [userSearch, setUserSearch] = useState("");
  // Debounced setter to avoid querying on every keystroke
  const debouncedSetUserSearch = React.useRef<NodeJS.Timeout | null>(null);

  // Use TanStack Query for user data
  const usersQuery = useQuery(
    orpc.user.list.queryOptions({
      input: {
        query: {
          limit: 20,
          offset: 0,
          filter: {
            _or: [
              { name: { operator: "ilike", value: userSearch } },
              { email: { operator: "ilike", value: userSearch } },
            ],
          },
        },
      },
      context: {
        headers: devAuthHeaders,
        noRedirectOnUnauthorized: true,
      },
    }),
  );

  const {
    data: usersData,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = usersQuery;

  const fetchAuthConfig = () => {
    setLoading(true);
    try {
      // Mock auth configuration
      const mockAuthConfig = {
        databaseUrl: process.env.DATABASE_URL ?? "Not configured",
        baseUrl:
          typeof window !== "undefined"
            ? window.location.origin
            : "http://localhost:3000",
        secret: "configured", // Never expose actual secret
        trustHost: true,
      };

      setTimeout(() => {
        setAuthConfig(mockAuthConfig);
        setLoading(false);
      }, 500);
    } catch (error) {
      logger.error("Failed to fetch auth config", { error });
      setLoading(false);
    }
  };

  const { data: session, refetch } = useSession();

  const handleLogout = async () => {
    try {
      setSwitchError(null);
      setSwitchMessage(null);
      setLogoutLoading(true);

      await signOut();

      await refetch();
      await refetchUsers();
      setSwitchMessage("Logged out successfully.");
    } catch (err) {
      logger.error("Logout error", { error: err });
      setSwitchError(
        err instanceof Error ? err.message : "Unexpected logout error",
      );
    } finally {
      setLogoutLoading(false);
    }
  };

  // placeholder; actual toggle handled inside AuthPluginComponent via context

  return (
    <>
      {/* Dev Auth Status Banner */}
      {devAuthEnabled && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
          <div className="flex items-center space-x-2">
            <span className="text-orange-600 dark:text-orange-400">🔑</span>
            <div>
              <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Dev Auth Token Mode Active
              </h4>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                All API requests are using Bearer token authentication with
                admin privileges
              </p>
              {!devAuthKey && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Missing <code>NEXT_PUBLIC_DEV_AUTH_KEY</code>: bearer auth is
                  enabled but no token is available client-side.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border p-4">
        <h3 className="mb-2 text-lg font-semibold">
          Authentication Configuration
        </h3>
        {loading ? (
          <div>Loading authentication configuration...</div>
        ) : authConfig ? (
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium">Database URL:</span>
              <span className="ml-2 font-mono text-xs">
                {authConfig.databaseUrl !== "Not configured"
                  ? "***" + authConfig.databaseUrl.slice(-10)
                  : "Not configured"}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Base URL:</span>
              <span className="ml-2">{authConfig.baseUrl}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Secret:</span>
              <span className="ml-2">
                {authConfig.secret === "configured"
                  ? "*** (configured)"
                  : "Not configured"}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Trust Host:</span>
              <span className="ml-2">
                {authConfig.trustHost ? "Yes" : "No"}
              </span>
            </div>
          </div>
        ) : (
          <div>No authentication configuration available</div>
        )}
      </div>

      {/* Dev Auth Token Toggle */}
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">Dev Auth Token Mode</h4>
            <p className="text-xs text-gray-500">
              Use Bearer token for all API requests (bypasses normal auth)
            </p>
            {devAuthEnabled && (
              <p className="mt-1 text-xs text-orange-600">
                ⚠️ Active: All requests use admin Bearer token
              </p>
            )}
          </div>
          <div>
            <label className="flex items-center space-x-3">
              <Switch
                checked={devAuthEnabled}
                onCheckedChange={(val: boolean) => {
                  setEnabled(val);
                }}
                aria-label="Enable Dev Auth"
              />
              <span className="text-sm">Enable Dev Auth</span>
            </label>
          </div>
        </div>
      </div>

      {/* User selector (autocomplete) */}
      <div className="rounded-lg border p-4">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-lg font-semibold">Login As</h4>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                void refetchUsers();
              }}
              className="rounded bg-gray-500 px-3 py-1 text-xs text-white hover:bg-gray-600"
              disabled={usersLoading}
            >
              {usersLoading ? "Loading..." : "Refresh"}
            </button>
            <button
              onClick={() => {
                void handleLogout();
              }}
              className="rounded bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-600 disabled:opacity-60"
              disabled={logoutLoading || switchingUserId !== null}
            >
              {logoutLoading ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Select user</label>
          <div>
            {/* Popover + Command based combobox */}
            <UserSelector
              onSearchChange={(v) => {
                if (debouncedSetUserSearch.current)
                  clearTimeout(debouncedSetUserSearch.current);
                debouncedSetUserSearch.current = setTimeout(() => {
                  setUserSearch(v);
                }, 300);
              }}
              users={usersData?.data ?? []}
              loading={usersLoading}
              selectedUserId={session?.user?.id}
              selectedUserName={session?.user?.name ?? session?.user?.email}
              disabled={switchingUserId !== null}
              onSelect={async (userId: string) => {
                try {
                  setSwitchError(null);
                  setSwitchMessage(null);

                  if (session?.user?.id && session.user.id === userId) {
                    setSwitchMessage("Already using this user session.");
                    return;
                  }

                  setSwitchingUserId(userId);

                  if (!devAuthKey) {
                    setSwitchError(
                      "Missing NEXT_PUBLIC_DEV_AUTH_KEY. Set it to the same value as DEV_AUTH_KEY, then restart the web dev server.",
                    );
                    return;
                  }

                  if (authClient?.loginAs) {
                    await authClient.loginAs(
                      { userId },
                      {
                        headers: devAuthBearerHeader,
                      },
                    );

                    await refetch();
                    await refetchUsers();
                    setSwitchMessage("Session switched successfully.");
                    return;
                  }

                  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
                  const url =
                    (apiBase.replace(/\/$/, "") || "") +
                    "/api/auth/dev/login-as";

                  const resp = await fetch(url, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${devAuthKey}`,
                    },
                    body: JSON.stringify({ userId }),
                  });

                  if (!resp.ok) {
                    logger.error("Login as failed", {
                      statusText: resp.statusText,
                      status: resp.status,
                    });
                    setSwitchError(
                      `Login as failed: ${resp.statusText || String(resp.status)}`,
                    );
                    return;
                  }

                  const data = (await resp.json()) as {
                    user?: { id: string; email: string };
                    session?: { id: string };
                  };
                  await refetch();
                  await refetchUsers();
                  setSwitchMessage(
                    `Logged as ${data.user?.id ?? userId}${data.session?.id ? ` • session ${data.session.id}` : ""}`,
                  );
                } catch (err) {
                  logger.error("Login as error", { error: err });
                  setSwitchError(
                    err instanceof Error ? err.message : "Unexpected login-as error",
                  );
                } finally {
                  setSwitchingUserId(null);
                }
              }}
            />

            <div className="min-h-5 pt-2 text-xs">
              {switchingUserId && (
                <span className="text-blue-600 dark:text-blue-400">
                  Switching session...
                </span>
              )}
              {!switchingUserId && switchMessage && (
                <span className="text-green-600 dark:text-green-400">
                  {switchMessage}
                </span>
              )}
              {!switchingUserId && switchError && (
                <span className="text-red-600 dark:text-red-400">
                  {switchError}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          fetchAuthConfig();
        }}
        className="rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
        disabled={loading}
      >
        {loading ? "Refreshing..." : "Refresh Auth Config"}
      </button>
    </>
  );
};

const AuthPlugin: TanStackDevtoolsReactPlugin = {
  id: "auth",
  name: "🔐 Auth",
  render: () => <AuthPluginComponent />,
};

// UserSelector component: Popover + Command based combobox
function UserSelector({
  users,
  loading,
  selectedUserId,
  selectedUserName,
  disabled = false,
  onSelect,
  onSearchChange,
}: {
  users: { id: string; name?: string; email: string }[];
  loading: boolean;
  selectedUserId?: string | null;
  selectedUserName?: string | null;
  disabled?: boolean;
  onSelect: (userId: string) => void | Promise<void>;
  onSearchChange?: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    if (selectedUserId) setValue(selectedUserId);
  }, [selectedUserId]);

  const frameworks = users.map((u) => ({
    value: u.id,
    label: u.name ?? u.email,
  }));

  // Ensure the selected user is always present in the list, even if the
  // server filter excluded them. This keeps the selected value visible.
  if (selectedUserId) {
    const exists = frameworks.find((f) => f.value === selectedUserId);
    if (!exists) {
      frameworks.unshift({
        value: selectedUserId,
        label: selectedUserName ?? selectedUserId,
      });
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <style>
        {`
                [data-radix-popper-content-wrapper] > ._devtool-user-popover {
                    z-index: 100000 !important;
                }
                `}
      </style>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-75 justify-between"
        >
          {value
            ? frameworks.find((f) => f.value === value)?.label
            : "Select user..."}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="_devtool-user-popover w-75 p-0">
        <Command>
          <CommandInput
            placeholder={loading ? "Loading users..." : "Search users..."}
            onValueChange={(v: string) => {
              setQuery(v);
              if (onSearchChange) onSearchChange(v);
            }}
          />
          <CommandList>
            <CommandEmpty>No user found.</CommandEmpty>
            <CommandGroup>
              {frameworks
                .filter((f) =>
                  f.label.toLowerCase().includes(query.toLowerCase()),
                )
                .map((framework) => (
                  <CommandItem
                    key={framework.value}
                    value={framework.value}
                    onSelect={(currentValue: string) => {
                      setValue(currentValue === value ? "" : currentValue);
                      setOpen(false);
                      void onSelect(currentValue);
                    }}
                  >
                    <CheckIcon
                      className={
                        "mr-2 h-4 w-4 " +
                        (value === framework.value
                          ? "opacity-100"
                          : "opacity-0")
                      }
                    />
                    {framework.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Drizzle Studio Plugin Component
const DrizzleStudioPluginComponent = () => {
  const studioUrl = `https://local.drizzle.studio`;

  const openStudio = () => {
    if (typeof window !== "undefined") window.open(studioUrl, "_blank");
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(studioUrl);
    } catch (err) {
      logger.error("Copy failed", { error: err });
    }
  };

  const reloadIframe = (iframeId: string) => {
    const el = document.getElementById(iframeId) as HTMLIFrameElement | null;
    // eslint-disable-next-line no-self-assign
    if (el) el.src = el.src;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-3">
        <div>
          <h3 className="text-lg font-semibold">Drizzle Studio</h3>
          <p className="text-sm text-gray-500">
            Embedded Drizzle Studio for database exploration
          </p>
        </div>

        <style>
          {`
                        [data-radix-popper-content-wrapper] > ._devtool-studio-popover {
                            z-index: 100000 !important;
                        }
                    `}
        </style>

        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="_devtool-studio-popover">
              <DropdownMenuItem onClick={openStudio}>
                Open in new tab
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void copyUrl()}>
                Copy URL
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  reloadIframe("drizzle-studio-iframe");
                }}
              >
                Reload
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-2">
        <iframe
          id="drizzle-studio-iframe"
          title="Drizzle Studio"
          src={studioUrl}
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
};

const DrizzleStudioPlugin: TanStackDevtoolsReactPlugin = {
  id: "drizzle-studio",
  name: "🧭 Drizzle Studio",
  render: () => <DrizzleStudioPluginComponent />,
};

// API URL Reference Plugin Component
const ApiUrlPluginComponent = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "";
  const referenceUrl = apiUrl ? `${apiUrl.replace(/\/$/, "")}/reference` : "";
  const [status, setStatus] = useState<string>("unknown");
  const [checking, setChecking] = useState(false);

  const copyApiUrl = async () => {
    try {
      await navigator.clipboard.writeText(apiUrl);
    } catch (err) {
      logger.error("Copy failed", { error: err });
    }
  };

  const openApiUrl = () => {
    if (!apiUrl) return;
    if (typeof window !== "undefined") window.open(apiUrl, "_blank");
  };

  const reloadIframe = (iframeId: string) => {
    const el = document.getElementById(iframeId) as HTMLIFrameElement | null;
    // eslint-disable-next-line no-self-assign
    if (el) el.src = el.src;
  };

  const checkHealth = React.useCallback(async () => {
    if (!apiUrl) return;
    setChecking(true);
    try {
      const resp = await fetch(apiUrl + "/health", { method: "GET" });
      setStatus(
        resp.ok
          ? `OK (${String(resp.status)})`
          : `Error (${String(resp.status)})`,
      );
    } catch (err) {
      logger.error("Health check error", { error: err });
      setStatus("unreachable");
    } finally {
      setChecking(false);
    }
  }, [apiUrl]);

  React.useEffect(() => {
    if (apiUrl) void checkHealth();
  }, [apiUrl, checkHealth]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-3">
        <div>
          <h3 className="text-lg font-semibold">API URL Reference</h3>
          <p className="text-sm text-gray-500">
            API endpoint and interactive reference
          </p>
        </div>

        <style>
          {`
                        [data-radix-popper-content-wrapper] > ._devtool-studio-popover {
                            z-index: 100000 !important;
                        }
                    `}
        </style>

        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="_devtool-studio-popover">
              <DropdownMenuItem onClick={openApiUrl}>
                Open API Root
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void copyApiUrl()}>
                Copy API URL
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  reloadIframe("api-reference-iframe");
                }}
              >
                Reload Reference
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void checkHealth()}>
                {checking ? "Checking..." : "Check Health"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-2">
        {referenceUrl ? (
          <iframe
            id="api-reference-iframe"
            title="API Reference"
            src={referenceUrl}
            className="h-full w-full border-0"
          />
        ) : (
          <div className="rounded-lg border p-4">
            <div className="text-sm">API URL not configured</div>
          </div>
        )}
      </div>

      <div className="p-2">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-sm">
            {apiUrl || "Not configured"}
          </span>
          <span className="text-sm text-gray-500">Health: {status}</span>
        </div>
      </div>
    </div>
  );
};

const ApiUrlPlugin: TanStackDevtoolsReactPlugin = {
  id: "api-url",
  name: "🔗 API URL",
  render: () => <ApiUrlPluginComponent />,
};

// Define all plugins
const plugins: TanStackDevtoolsReactPlugin[] = [
  ReactQueryPlugin,
  RoutesPlugin,
  BundlesPlugin,
  CLIPlugin,
  AuthPlugin,
  DrizzleStudioPlugin,
  ApiUrlPlugin,
];

export interface TanStackDevToolsProps {
  /**
   * Whether to show the devtools in production
   * @default false
   */
  showInProduction?: boolean;
}

export const TanStackDevTools: React.FC<TanStackDevToolsProps> = ({
  showInProduction = false,
}) => {
  // Only show in development by default, unless explicitly enabled for production
  if (process.env.NODE_ENV === "production" && !showInProduction) {
    return null;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { refetch } = useSession();

  const providers: React.FC<{ children: React.ReactNode }>[] = [];
  if (hasMasterTokenPlugin(authClient)) {
    providers.push(({ children }) => (
      <MasterTokenProvider refetch={refetch}>{children}</MasterTokenProvider>
    ));
  }

  const handleProvider = (
    children: React.ReactNode,
    index = 0,
  ): React.ReactNode => {
    const Provider = providers[index];
    if (!Provider) return children;
    return <Provider>{handleProvider(children, index + 1)}</Provider>;
  };

  return handleProvider(
    <TanStackDevtools
      plugins={plugins}
      config={{
        position: "bottom-right",
        panelLocation: "bottom",
      }}
    />,
  );
};

export default TanStackDevTools;
