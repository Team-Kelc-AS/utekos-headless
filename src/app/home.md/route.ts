import { buildHomeMarkdown } from '@/lib/agents/homeMarkdown'
import {
  MARKDOWN_CONTENT_TYPE,
  withVaryAccept
} from '@/lib/agents/markdownNegotiation'

export async function GET() {
  const headers = withVaryAccept(new Headers())
  headers.set('Content-Type', MARKDOWN_CONTENT_TYPE)
  headers.set(
    'Cache-Control',
    'public, s-maxage=86400, stale-while-revalidate=86400'
  )
  headers.set('Link', '<https://utekos.no/>; rel="canonical"')
  headers.set('X-Content-Type-Options', 'nosniff')

  return new Response(buildHomeMarkdown(), { headers })
}
