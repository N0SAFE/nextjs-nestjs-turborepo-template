export interface PackageResult {
  name: string
  total: number
  passed: number
  failed: number
  duration: number
}

export interface FailureDetail {
  package: string
  test: string
  error: string
  file: string
  line: number
}

export interface TestSummary {
  total: number
  passed: number
  failed: number
  skipped: number
  duration: number
}

export interface LatestTestRun {
  timestamp: string
  summary: TestSummary
  byPackage: PackageResult[]
  failures: FailureDetail[]
}

export interface HistoryEntry {
  date: string
  total: number
  passed: number
  failed: number
  duration: number
}

export interface TestResultsResponse {
  latest: LatestTestRun
  history: HistoryEntry[]
}

const DEFAULT_BASE_URL = "http://localhost:3002"

function buildEndpoint(baseUrl: string): string {
  const normalized = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
  return `${normalized}/api/test-results`
}

export async function fetchTestResults(): Promise<TestResultsResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_BASE_URL
    const endpoint = buildEndpoint(baseUrl)
    const response = await fetch(endpoint, {
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      console.error("Failed to fetch test results", response.statusText)
      return null
    }

    const data = (await response.json()) as TestResultsResponse
    return data
  } catch (error) {
    console.error("Error fetching test results:", error)
    return null
  }
}
