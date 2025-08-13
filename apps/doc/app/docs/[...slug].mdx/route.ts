import { getMDXContent } from 'fumadocs-mdx'
import { pageTree } from '#site/page-tree'

export const GET = async (req: Request) => {
  const page = await getMDXContent(req, pageTree)
  return new Response(page.content, {
    headers: { 'Content-Type': 'text/markdown' },
  })
}
