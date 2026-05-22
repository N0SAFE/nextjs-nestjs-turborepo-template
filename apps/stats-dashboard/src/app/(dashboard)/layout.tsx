import { DashboardHeader } from "@/components/dashboard-header";
import React from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <DashboardHeader title="Dashboard Overview" description="Repository statistics and test coverage visualization" />
            <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
        </>
    );
}
