import { CoverageByPackage } from '@/components/coverage-by-package'
import { Suspense } from 'react'
import { Skeleton } from '@repo/ui/components/shadcn/skeleton'

export default function CoveragePackagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coverage by Package</h1>
        <p className="text-muted-foreground">
          Detailed test coverage breakdown for each package and application in the monorepo
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-[600px] w-full" />
          </div>
        }
      >
        <CoverageByPackage />
      </Suspense>
    </div>
  )
}
