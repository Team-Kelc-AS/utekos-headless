import { buildHomeMarkdown } from '@/lib/agents/homeMarkdown'
import {
  MARKDOWN_CONTENT_TYPE,
  withVaryAccept
} from '@/lib/agents/markdownNegotiation'

const SITE_URL = 'https://utekos.no'

/**
 * Top-level sections that exist as HTML pages. Requests for these with
 * `Accept: text/markdown` get a Markdown pointer instead of a 404 so the
 * resolver never reports a false negative.
 */
const KNOWN_SECTION_PREFIXES = [
  '/produkter',
  '/magasinet',
  '/inspirasjon',
  '/kunnskap',
  '/handlehjelp',
  '/skreddersy-varmen',
  '/kampanje',
  '/nbcc',
  '/kontaktskjema',
  '/personvern',
  '/frakt-og-retur',
  '/om-oss',
  '/vilkar-betingelser',
  '/comfyrobe',
  '/gaveguide',
  '/kjop',
  '/customer',
  '/design',
  '/video'
]

const KNOWN_EXACT_PATHS = new Set([
  '/',
  '/llms',
  '/llms.txt',
  '/llms-full.txt',
  '/om-oss.md',
  '/home.md',
  '/sitemap.xml',
  '/robots.txt'
])

function markdownHeaders(status: number): { headers: Headers; status: number } {
  const headers = withVaryAccept(new Headers())
  headers.set('Content-Type', MARKDOWN_CONTENT_TYPE)
  headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  headers.set('X-Content-Type-Options', 'nosniff')
  return { headers, status }
}

function buildKnownSectionStub(path: string): string {
  return `# Utekos – ${path}

Denne siden leveres som HTML. Åpne den kanoniske siden for fullt innhold:

- [${SITE_URL}${path}](${SITE_URL}${path})

## Hjelpeflater

- [Forsiden](${SITE_URL}/)
- [AI-indeks (llms.txt)](${SITE_URL}/llms.txt)
- [Nettstedskart](${SITE_URL}/sitemap.xml)
`
}

function buildNotFoundMarkdown(path: string): string {
  return `# Siden ble ikke funnet (404)

Beklager – siden \`${path}\` finnes ikke på utekos.no. Sjekk adressen for skrivefeil,
eller bruk en av lenkene under for å finne frem.

## Hvor vil du?

- [Forsiden](${SITE_URL}/)
- [Alle produkter](${SITE_URL}/produkter)
- [Nettstedskart](${SITE_URL}/sitemap.xml)
- [AI-indeks (llms.txt)](${SITE_URL}/llms.txt)
- [Utvidet AI-kontekst](${SITE_URL}/llms-full.txt)
- [Kontakt oss](${SITE_URL}/kontaktskjema)
`
}

export function resolveAgentMarkdown(path: string): { body: string; status: number } {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (normalized === '/') return { body: buildHomeMarkdown(), status: 200 }
  if (KNOWN_EXACT_PATHS.has(normalized)) {
    return { body: buildKnownSectionStub(normalized), status: 200 }
  }
  if (KNOWN_SECTION_PREFIXES.some(prefix => normalized === prefix || normalized.startsWith(`${prefix}/`))) {
    return { body: buildKnownSectionStub(normalized), status: 200 }
  }
  return { body: buildNotFoundMarkdown(normalized), status: 404 }
}

export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get('path') ?? '/'
  const { body, status } = resolveAgentMarkdown(path)
  return new Response(body, markdownHeaders(status))
}
