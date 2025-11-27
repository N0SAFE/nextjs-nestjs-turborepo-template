"use client";

import { Button } from "@repo/ui/components/shadcn/button";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="bg-muted mb-6 flex h-20 w-20 items-center justify-center rounded-full mx-auto">
          <WifiOff className="text-muted-foreground h-10 w-10" />
        </div>
        <h1 className="mb-4 text-4xl font-bold">You&apos;re Offline</h1>
        <p className="text-muted-foreground mb-8 max-w-md text-lg">
          It seems you&apos;ve lost your internet connection. Please check your
          network settings and try again.
        </p>
        <Button
          onClick={() => {
            window.location.reload();
          }}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
