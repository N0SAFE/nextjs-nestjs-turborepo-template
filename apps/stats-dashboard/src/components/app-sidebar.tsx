"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
} from "@repo/ui/components/shadcn/sidebar";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Progress } from "@repo/ui/components/shadcn/progress";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { BarChart3, ChevronRight, FileText, Home, Package, Settings, TestTube2, TrendingUp, type LucideIcon } from "lucide-react";
import {
    Home as HomeRoute,
    CoverageOverview,
    CoverageByPackage,
    CoverageTrends,
    DashboardBuildStatsBuildTimes,
    DashboardBuildStatsBundleSizes,
    DashboardDocumentation,
    DashboardPackagesDependencies,
    DashboardPackagesHealth,
    DashboardSettings,
    DashboardTestResultsHistory,
    DashboardTestResultsLatest,
} from "@/routes";
import { fetchApi } from "@/lib/api-client";
import type { CoverageData } from "@/app/api/coverage/route";
import { cn, formatDate, formatPercentage, getCoverageBgColor, getCoverageColor } from "@/lib/utils";

interface AppRouteLink {
    href: string;
    Link: typeof HomeRoute.Link;
}

interface NavLink {
    title: string;
    route?: AppRouteLink;
    url?: string;
    description?: string;
}

interface NavItem extends NavLink {
    icon?: LucideIcon;
    badge?: string;
    items?: NavLink[];
}

interface NavSection {
    label: string;
    items: NavItem[];
}

interface RouteWithLink {
    (): string;
    Link: typeof HomeRoute.Link;
}

const createRouteLink = (route: unknown): AppRouteLink => {
    if (typeof route === "function" && "Link" in route) {
        const typedRoute = route as RouteWithLink;
        return {
            href: typedRoute(),
            Link: typedRoute.Link,
        };
    }

    throw new Error("Invalid route configuration encountered in sidebar navigation.");
};

const navigationSections: NavSection[] = [
    {
        label: "Overview",
        items: [
            {
                title: "Overview",
                icon: Home,
                route: createRouteLink(HomeRoute),
                description: "Snapshot of repository health",
            },
            {
                title: "Documentation",
                icon: FileText,
                route: createRouteLink(DashboardDocumentation),
                description: "Reference materials and usage guides",
            },
        ],
    },
    {
        label: "Quality Insights",
        items: [
            {
                title: "Coverage",
                icon: TrendingUp,
                badge: "Quality",
                description: "Understand coverage distribution",
                items: [
                    { title: "Overview", route: createRouteLink(CoverageOverview) },
                    { title: "By Package", route: createRouteLink(CoverageByPackage) },
                    { title: "Trends", route: createRouteLink(CoverageTrends) },
                ],
            },
            {
                title: "Test Results",
                icon: TestTube2,
                description: "Latest and historical test outcomes",
                items: [
                    { title: "Latest Run", route: createRouteLink(DashboardTestResultsLatest) },
                    { title: "History", route: createRouteLink(DashboardTestResultsHistory) },
                ],
            },
        ],
    },
    {
        label: "Build & Packages",
        items: [
            {
                title: "Build Stats",
                icon: BarChart3,
                description: "Build health and bundle composition",
                items: [
                    { title: "Build Times", route: createRouteLink(DashboardBuildStatsBuildTimes) },
                    { title: "Bundle Sizes", route: createRouteLink(DashboardBuildStatsBundleSizes) },
                ],
            },
            {
                title: "Packages",
                icon: Package,
                description: "Dependency health and risks",
                items: [
                    { title: "Dependencies", route: createRouteLink(DashboardPackagesDependencies) },
                    { title: "Health", route: createRouteLink(DashboardPackagesHealth) },
                ],
            },
        ],
    },
];

const resolveHref = (link: NavLink): string | null => {
    if (link.route) {
        return link.route.href;
    }
    return link.url ?? null;
};

const isPathActive = (pathname: string, link: NavLink): boolean => {
    const href = resolveHref(link);
    if (!href || href === "#") {
        return false;
    }

    if (href === "/") {
        return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
};

const formatPackageLabel = (name: string): string => name.replace(/^app:/, "App • ").replace(/^pkg:/, "Pkg • ");

export function AppSidebar({ children }: { children?: React.ReactNode }) {
    const pathname = usePathname();
    const [coverage, setCoverage] = useState<CoverageData | null>(null);
    const [coverageError, setCoverageError] = useState<string | null>(null);
    const [isLoadingCoverage, setIsLoadingCoverage] = useState<boolean>(true);

    useEffect(() => {
        let active = true;

        const loadCoverage = async () => {
            try {
                setIsLoadingCoverage(true);
                const data = await fetchApi<CoverageData>("/coverage");
                if (!active) {
                    return;
                }
                setCoverage(data);
                setCoverageError(null);
            } catch (error) {
                if (!active) {
                    return;
                }

                const message = error instanceof Error ? error.message : "Unable to load coverage data.";

                setCoverage(null);
                setCoverageError(message.includes("404") ? "Coverage data is not available yet. Run tests with coverage to populate these insights." : "We couldn't load coverage insights right now.");
            } finally {
                if (active) {
                    setIsLoadingCoverage(false);
                }
            }
        };

        void loadCoverage();

        return () => {
            active = false;
        };
    }, []);

    const overallCoverage = coverage?.overall.lines ?? null;
    const strongestPackage = useMemo(() => {
        if (!coverage?.packages.length) {
            return null;
        }

        return coverage.packages[0];
    }, [coverage]);

    const riskiestPackage = useMemo(() => {
        if (!coverage?.packages.length) {
            return null;
        }

        return coverage.packages[coverage.packages.length - 1];
    }, [coverage]);

    return (
        <SidebarProvider defaultOpen={true}>
            <Sidebar className="border-r border-border/40 bg-sidebar/80 backdrop-blur supports-backdrop-filter:bg-sidebar/60">
                <SidebarContent className="gap-6 pb-8 pt-4">
                    <SidebarGroup className="px-2">
                        <SidebarGroupLabel className="text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">Health snapshot</SidebarGroupLabel>
                        <SidebarGroupContent>
                            {isLoadingCoverage ? (
                                <div className="space-y-3 rounded-2xl border border-border/60 bg-background/60 p-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-16" />
                                    <Skeleton className="h-2 w-full" />
                                    <div className="grid gap-2">
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </div>
                            ) : coverage ? (
                                <div className="space-y-3 rounded-2xl border border-primary/15 bg-primary/5 p-4 shadow-sm dark:bg-primary/10">
                                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                                        <span>Overall coverage</span>
                                        {coverage.lastUpdate && <span>Updated {formatDate(coverage.lastUpdate)}</span>}
                                    </div>
                                    <div className="flex items-baseline justify-between gap-2">
                                        <p className="text-3xl font-semibold tracking-tight">{overallCoverage !== null ? formatPercentage(overallCoverage) : "—"}</p>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "rounded-full border-transparent text-xs font-semibold",
                                                overallCoverage !== null ? cn(getCoverageBgColor(overallCoverage), getCoverageColor(overallCoverage)) : "bg-muted text-muted-foreground"
                                            )}
                                        >
                                            Stability
                                        </Badge>
                                    </div>
                                    <Progress value={overallCoverage ?? 0} className="h-2" />
                                    <div className="grid gap-2 text-sm">
                                        {strongestPackage && (
                                            <div className="flex items-center justify-between rounded-xl border border-transparent bg-background/60 px-3 py-2">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top performer</span>
                                                    <span className="font-medium text-foreground">{formatPackageLabel(strongestPackage.name)}</span>
                                                </div>
                                                <span className="text-sm font-semibold text-foreground">{formatPercentage(strongestPackage.statements)}</span>
                                            </div>
                                        )}
                                        {riskiestPackage && (
                                            <div className="flex items-center justify-between rounded-xl border border-dashed border-amber-400/50 bg-amber-500/10 px-3 py-2 text-amber-900 dark:border-amber-300/40 dark:text-amber-200">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold uppercase tracking-wider">Needs attention</span>
                                                    <span className="font-medium">{formatPackageLabel(riskiestPackage.name)}</span>
                                                </div>
                                                <span className="text-sm font-semibold">{formatPercentage(riskiestPackage.statements)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                                    {coverageError ?? "Coverage data is not available yet. Run tests with coverage to populate these insights."}
                                </div>
                            )}
                        </SidebarGroupContent>
                    </SidebarGroup>

                    {navigationSections.map((section) => (
                        <SidebarGroup key={section.label} className="px-2">
                            <SidebarGroupLabel className="text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">{section.label}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu className="mt-1 space-y-1">
                                    {section.items.map((item) => {
                                        const Icon = item.icon;
                                        const hasChildren = Boolean(item.items?.length);
                                        const isActive = hasChildren ? (item.items?.some((child) => isPathActive(pathname, child)) ?? false) : isPathActive(pathname, item);

                                        return (
                                            <SidebarMenuItem key={`${section.label}-${item.title}`} className="group">
                                                {hasChildren ? (
                                                    <>
                                                        <SidebarMenuButton
                                                            isActive={isActive}
                                                            tooltip={item.description}
                                                            className="flex items-center justify-between gap-2 border border-transparent bg-transparent px-2 py-2 text-sm font-medium transition hover:border-primary/30 hover:bg-primary/5 data-[active=true]:border-primary/40 data-[active=true]:bg-primary/10"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                                                                <span className="text-foreground">{item.title}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {item.badge && (
                                                                    <Badge variant="outline" className="rounded-full border-transparent bg-primary/10 text-xs font-semibold text-primary">
                                                                        {item.badge}
                                                                    </Badge>
                                                                )}
                                                                <ChevronRight className="h-4 w-4 text-muted-foreground transition group-data-[active=true]:text-primary" />
                                                            </div>
                                                        </SidebarMenuButton>
                                                        <SidebarMenuSub className="border-l border-border/50 pl-3">
                                                            {item.items?.map((subItem) => {
                                                                const subActive = isPathActive(pathname, subItem);
                                                                return (
                                                                    <SidebarMenuSubItem key={`${item.title}-${subItem.title}`}>
                                                                        <SidebarMenuSubButton
                                                                            asChild
                                                                            isActive={subActive}
                                                                            className="flex items-center justify-between gap-2 text-sm font-medium text-muted-foreground transition hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/15 data-[active=true]:text-primary"
                                                                        >
                                                                            {subItem.route ? (
                                                                                <subItem.route.Link className="flex w-full items-center justify-between gap-3">
                                                                                    <span>{subItem.title}</span>
                                                                                    {subActive && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                                                                                </subItem.route.Link>
                                                                            ) : (
                                                                                <a href={subItem.url ?? "#"}>{subItem.title}</a>
                                                                            )}
                                                                        </SidebarMenuSubButton>
                                                                    </SidebarMenuSubItem>
                                                                );
                                                            })}
                                                        </SidebarMenuSub>
                                                    </>
                                                ) : (
                                                    <SidebarMenuButton
                                                        asChild={Boolean(item.route)}
                                                        isActive={isActive}
                                                        tooltip={item.description}
                                                        className="flex items-center justify-between gap-2 border border-transparent bg-transparent px-2 py-2 text-sm font-medium transition hover:border-primary/30 hover:bg-primary/5 data-[active=true]:border-primary/40 data-[active=true]:bg-primary/10"
                                                    >
                                                        {item.route ? (
                                                            <item.route.Link className="flex w-full items-center justify-between gap-2">
                                                                <span className="flex items-center gap-2">
                                                                    {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                                                                    <span className="text-foreground">{item.title}</span>
                                                                </span>
                                                                <ChevronRight className="h-4 w-4 text-muted-foreground transition group-data-[active=true]:text-primary" />
                                                            </item.route.Link>
                                                        ) : (
                                                            <a href={item.url ?? "#"} className="flex w-full items-center justify-between gap-2">
                                                                <span className="flex items-center gap-2">
                                                                    {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                                                                    <span className="text-foreground">{item.title}</span>
                                                                </span>
                                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                            </a>
                                                        )}
                                                    </SidebarMenuButton>
                                                )}
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    ))}
                </SidebarContent>

                <SidebarFooter className="border-t border-border/40 bg-background/60 px-4 py-5">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Status</span>
                            <Badge variant="outline" className="rounded-full border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-200">
                                Healthy
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{coverageError ?? "Keep your repository green by watching coverage trends and package health."}</p>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border/60 bg-background/80 px-3 py-2 text-sm font-medium transition hover:border-primary/40 hover:bg-primary/10"
                                >
                                    <DashboardSettings.Link className="flex w-full items-center justify-between gap-2">
                                        <span className="flex items-center gap-2">
                                            <Settings className="h-4 w-4" />
                                            <span>Settings</span>
                                        </span>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </DashboardSettings.Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </div>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
    );
}
