import { notFound } from 'next/navigation'
import { source } from '@/lib/source'
import { DocsBody, DocsPage, DocsTitle, DocsDescription } from 'fumadocs-ui/page'
import defaultMdxComponents from 'fumadocs-ui/mdx'

export async function generateStaticParams() {
  // Ensure we don't return an empty slug (which would collide with /docs index)
  const params = await source.generateParams()
  return params.filter((p: { slug?: string[] }) => Array.isArray(p.slug) && p.slug.length > 0)
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const page = source.getPage(slug)
  if (!page) {
    notFound()
  }
  const MDX = page.data.body

  return (
    <DocsPage toc={page.data.toc} lastUpdate={page.data.lastModified ? new Date(page.data.lastModified) : undefined}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={defaultMdxComponents} />
      </DocsBody>
    </DocsPage>
  )
}
