export interface TestFailure {
  package: string
  test: string
  error: string
  file: string
  line: number
}

export interface TestPackageSummary {
  name: string
  total: number
  passed: number
  failed: number
  duration: number
}

export interface TestRunSummary {
  total: number
  passed: number
  failed: number
  skipped: number
  duration: number
}

export interface TestRunHistoryEntry {
  date: string
  total: number
  passed: number
  failed: number
  duration: number
}

export interface TestResultsResponse {
  latest: {
    timestamp: string
    summary: TestRunSummary
    byPackage: TestPackageSummary[]
    failures: TestFailure[]
  }
  history: TestRunHistoryEntry[]
}

export interface BuildPackageStat {
  name: string
  time: number
  trend: 'up' | 'down' | 'stable'
}

export interface BuildTimesHistoryEntry {
  date: string
  average: number
  fastest: number
  slowest: number
}

export interface BundlePackageStat {
  name: string
  size: number
  gzipped: number
  change: number
}

export interface BundleHistoryEntry {
  date: string
  total: number
  largest: number
  average: number
}

export interface BuildStatsResponse {
  buildTimes: {
    summary: {
      average: number
      fastest: number
      slowest: number
      totalPackages: number
    }
    byPackage: BuildPackageStat[]
    history: BuildTimesHistoryEntry[]
  }
  bundleSizes: {
    summary: {
      total: number
      largest: number
      average: number
      change: number
    }
    byPackage: BundlePackageStat[]
    history: BundleHistoryEntry[]
  }
}

export interface PackageVulnerabilitySummary {
  critical: number
  high: number
  medium: number
  low: number
}

export interface PackageHealthEntry {
  name: string
  type: 'app' | 'package'
  dependencies: number
  devDependencies: number
  outdated: number
  vulnerabilities: PackageVulnerabilitySummary
  health: number
  license: string
}

export interface DependencyEdge {
  from: string
  to: string
  type: string
}

export interface DuplicateDependency {
  package: string
  versions: string[]
  count: number
}

export interface PackagesResponse {
  summary: {
    totalPackages: number
    totalDependencies: number
    outdated: number
    duplicates: number
    healthScore: number
    securityIssues: number
    licenseIssues: number
  }
  packages: PackageHealthEntry[]
  dependencies: {
    graph: DependencyEdge[]
    duplicates: DuplicateDependency[]
  }
}

export interface CoverageMetric {
  statements: number
  branches: number
  functions: number
  lines: number
}

export interface CoveragePackageMetric extends CoverageMetric {
  name: string
}

export interface CoverageHistoryEntry extends CoverageMetric {
  date: string
}

export interface CoverageResponse {
  overall: CoverageMetric
  packages: CoveragePackageMetric[]
  history: CoverageHistoryEntry[]
  timestamp: string
}
