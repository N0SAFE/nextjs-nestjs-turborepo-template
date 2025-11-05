import { StatsGrid } from "@/components/stats-grid";
import { CoverageOverview } from "@/components/coverage-overview";
import { CoverageByPackage } from "@/components/coverage-by-package";

export default function Home() {
    return (
        <>
            <div className="mt-4">
                <StatsGrid />
            </div>
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                    <CoverageOverview />
                </div>
                <div className="md:col-span-1">
                    <CoverageByPackage />
                </div>
            </div>
        </>
    );
}
