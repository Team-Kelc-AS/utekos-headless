import { NextRequest } from 'next/server'
import {
  fetchMetaStatsReport,
  renderMetaStatsMarkdown
} from '@/lib/meta-insights/metaStatsReport'

const headers = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Disposition': 'inline; filename="meta-stats.md"',
  'Content-Type': 'text/markdown; charset=utf-8'
}

export async function GET(request: NextRequest) {
  const start = request.nextUrl.searchParams.get('start')
  const end = request.nextUrl.searchParams.get('end')

  if (!start || !end) {
    return new Response('# Meta-statistikk\n\nMangler `start` og/eller `end` i URL.\n', {
      status: 400,
      headers
    })
  }

  try {
    const report = await fetchMetaStatsReport(start, end)
    return new Response(renderMetaStatsMarkdown(report), { headers })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ukjent Meta API-feil'
    console.error('Meta API Feil:', message)
    return new Response(
      `# Meta-statistikk\n\nKunne ikke hente Meta-data: ${message.replaceAll('\n', ' ')}\n`,
      { status: 500, headers }
    )
  }
}
