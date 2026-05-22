const API_BASE_PATH = '/api'

interface NextFetchConfig {
  revalidate?: number
  tags?: string[]
}

interface FetchOptions extends RequestInit {
  next?: NextFetchConfig
}

async function parseJSON<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error('Request failed with status ' + response.status.toString())
  }

  const contentType = response.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    throw new Error('Unexpected response format')
  }

  return (await response.json()) as T
}

export async function fetchApi<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_PATH}${endpoint}`

  const headers = new Headers(options?.headers)
  if (!headers.has('accept')) {
    headers.set('accept', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    headers,
    cache: options?.cache ?? 'no-store',
  })

  return parseJSON<T>(response)
}
