import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/shadcn/card'

export default function DocumentationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
        <p className="text-muted-foreground">
          Project documentation and guides for the stats dashboard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Learn how to use the stats dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Navigate using the sidebar to explore different metrics</li>
              <li>• Coverage data is automatically collected from test runs</li>
              <li>• Build stats track performance over time</li>
              <li>• Package health monitors dependency status</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>Available dashboard features</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Test coverage visualization</li>
              <li>• Test execution results</li>
              <li>• Build performance metrics</li>
              <li>• Bundle size analysis</li>
              <li>• Package dependency tracking</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Reference</CardTitle>
            <CardDescription>Available API endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 font-mono text-xs">
              <li>• GET /api/coverage - Test coverage data</li>
              <li>• GET /api/test-results - Test execution results</li>
              <li>• GET /api/build-stats - Build performance metrics</li>
              <li>• GET /api/packages - Package information</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Dashboard configuration options</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• NEXT_PUBLIC_STATS_PORT - Server port (default: 3002)</li>
              <li>• Coverage data location: ./coverage/coverage-final.json</li>
              <li>• Theme: Supports light and dark modes</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
