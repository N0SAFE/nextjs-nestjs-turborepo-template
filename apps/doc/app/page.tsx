import Link from 'next/link'

export default function Home() {
  return (
    <main className="relative isolate">
      {/* gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background to-muted/40" />
      <section className="container mx-auto flex min-h-[70dvh] flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mb-3 inline-flex rounded-full border px-3 py-1 text-xs text-muted-foreground">
            Next.js + NestJS Turborepo
          </div>
          <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Documentation Hub
          </h1>
          <p className="mb-8 text-pretty text-muted-foreground md:text-lg">
            Explore the template architecture, development workflow, and deployment guides.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/docs/getting-started"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium"
            >
              Get Started
            </Link>
            <Link
              href="/docs"
              className="border-input hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
            >
              Browse All Docs
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
