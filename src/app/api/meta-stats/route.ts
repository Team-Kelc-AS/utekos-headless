import { NextRequest, NextResponse } from 'next/server'
import { fetchMetaStatsReport } from '@/lib/meta-insights/metaStatsReport'

export async function GET(request: NextRequest) {
  const start = request.nextUrl.searchParams.get('start')
  const end = request.nextUrl.searchParams.get('end')

  if (!start || !end) {
    return NextResponse.json(
      { error: 'Mangler start og/eller end parametere i URL' },
      { status: 400, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }

  try {
    const report = await fetchMetaStatsReport(start, end)
    return NextResponse.json(report, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ukjent Meta API-feil'
    console.error('Meta API Feil:', message)
    return NextResponse.json(
      { error: 'Kunne ikke hente Meta-data', details: message },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }
}
