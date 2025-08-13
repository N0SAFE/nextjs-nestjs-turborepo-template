import Link from 'next/link'
import { source } from '@/lib/source'

type Page = ReturnType<typeof source.getPages>[number]

function groupAndSort(pages: Page[]) {
  // Group by top-level dir in content/docs (if any)
  const groups = new Map<string, Page[]>()
  for (const p of pages) {
    const path = p.file.path || '' // e.g., 'getting-started.mdx' or 'docker/docker-compose.mdx'
    const [first] = path.split('/')
    const group = path.includes('/') ? first : 'general'
    if (!groups.has(group)) {
      groups.set(group, [])
    }
    groups.get(group)!.push(p)
  }
  // Sort pages within group by frontmatter order, then title
  for (const [k, arr] of groups) {
    arr.sort((a, b) => {
      const ao = (a.data as any)?.order ?? 9999
      const bo = (b.data as any)?.order ?? 9999
      if (ao !== bo) {
        return ao - bo
      }
      return String(a.data.title).localeCompare(String(b.data.title))
    })
    groups.set(k, arr)
  }
  // Sort groups by a preferred order; fallback alphabetical
  const preferred = ['general', 'intro', 'architecture', 'dev', 'routing', 'docker', 'deployment', 'testing', 'tooling', 'reference']
  const entries = Array.from(groups.entries())
  entries.sort((a, b) => {
    const ai = preferred.indexOf(a[0])
    const bi = preferred.indexOf(b[0])
    if (ai !== -1 && bi !== -1) {
      return ai - bi
    }
    if (ai !== -1) {
      return -1
    }
    if (bi !== -1) {
      return 1
    }
    return a[0].localeCompare(b[0])
  })
  return entries
}

export default function DocsIndex() {
  const pages = source.getPages()
  const groups = groupAndSort(pages)
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-4">Docs</h1>
      <div className="space-y-8">
        {groups.map(([group, arr]) => (
          <section key={group}>
            <h2 className="text-xl font-semibold mb-2 capitalize">{group}</h2>
            <ul className="list-disc ml-6">
              {arr.map((p) => (
                <li key={p.url}>
                  <Link href={p.url}>{p.data.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  )
}
