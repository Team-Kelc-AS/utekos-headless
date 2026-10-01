// app/api/meta-quality/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const datasetId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!datasetId || !accessToken) {
    return NextResponse.json(
      { error: 'Meta Dataset ID eller Access Token mangler i miljøvariablene.' },
      { status: 500 }
    );
  }

  const url = `https://graph.facebook.com/v26.0/${datasetId}?fields=event_coverage,integration_quality,setup_quality,emq_diagnostics&access_token=${accessToken}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },

      next: { revalidate: 3600 }, 
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Meta API Error: ${errorData.error?.message}`);
    }

    const data = await res.json();
    
    // Returnerer data freshness, event coverage, deduplication & EMQ
    return NextResponse.json(data);

  } catch (error) {
    console.error('Feil ved henting av Dataset Quality fra Meta:', error);
    return NextResponse.json(
      { error: 'Kunne ikke hente Event Quality-data' },
      { status: 500 }
    );
  }
}