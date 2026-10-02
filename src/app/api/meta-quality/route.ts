import { NextResponse } from 'next/server'
import {
  fetchMetaDatasetQuality,
  readMetaDatasetQualityConfig
} from '@/lib/analytics/server/fetchMetaDatasetQuality'

const noStore = {
  'Cache-Control': 'no-store, max-age=0'
} as const

export async function GET() {
  try {
    const config = readMetaDatasetQualityConfig()
    const data = await fetchMetaDatasetQuality(config)

    return NextResponse.json(data, { headers: noStore })
  } catch (error) {
    console.error('Feil ved henting av Dataset Quality fra Meta:', error)

    const message =
      error instanceof Error ? error.message : 'Ukjent Meta API-feil'
    const missingConfig = message.startsWith(
      'Missing required Meta Dataset Quality configuration'
    )

    return NextResponse.json(
      {
        error: missingConfig
          ? 'Meta Dataset ID eller Access Token mangler i miljøvariablene.'
          : 'Kunne ikke hente Event Quality-data',
        details: message
      },
      { status: 500, headers: noStore }
    )
  }
}
