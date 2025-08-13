import { NextResponse } from 'next/server'
import { source } from '@/lib/source'

export const revalidate = false

export function GET() {
  const results = [] as Array<{
    _id: string
    title: string
    description?: string
    url: string
  }>

  for (const page of source.getPages()) {
    results.push({
      _id: page.url,
      url: page.url,
      title: page.data.title,
      description: page.data.description,
    })
  }

  return NextResponse.json(results)
}
