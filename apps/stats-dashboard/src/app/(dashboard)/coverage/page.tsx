import { CoverageOverview } from '@/components/coverage-overview'
import { Suspense } from 'react'
import { Skeleton } from '@repo/ui/components/shadcn/skeleton'

export default function CoveragePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coverage Overview</h1>
        <p className="text-muted-foreground">
          Comprehensive test coverage analysis across all packages and applications
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-[400px] w-full" />
          </div>
        }
      >
        <CoverageOverview />
      </Suspense>
    </div>
  )
}
