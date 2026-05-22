"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@repo/ui/components/shadcn/sidebar";
import { Separator } from "@repo/ui/components/shadcn/separator";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/shadcn/tooltip";
import { DashboardDocumentation } from "@/routes";
import { DownloadCloud, FileText, Info, RefreshCw } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  description?: string;
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const router = useRouter();

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleExport = useCallback(() => {
    if (typeof window !== "undefined") {
      window.print();
    }
  }, []);

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/60 sm:flex-nowrap">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <SidebarTrigger className="-ml-1 flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background/70 text-muted-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" />
        <Separator orientation="vertical" className="hidden h-6 sm:block" />
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
              Live metrics
            </Badge>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="About this dashboard"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-background/70 text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" className="max-w-xs text-xs text-muted-foreground">
                  Monitor repository health across coverage, tests, builds, and packages with real-time context.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {description ?? "Keep your repository green by tracking quality, performance, and package risk at a glance."}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg border border-transparent text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Refresh insights</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs text-muted-foreground">
              Refresh data to view the latest coverage and build metrics.
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg border border-transparent text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                onClick={handleExport}
              >
                <DownloadCloud className="h-4 w-4" />
                <span className="sr-only">Export snapshot</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs text-muted-foreground">
              Save or print the current dashboard snapshot for sharing.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          asChild
          variant="default"
          className="flex items-center gap-2 rounded-lg bg-primary/90 px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <DashboardDocumentation.Link className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Docs</span>
          </DashboardDocumentation.Link>
        </Button>
      </div>
    </header>
  );
}
