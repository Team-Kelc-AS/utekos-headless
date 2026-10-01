// app/api/meta-stats/route.ts
// 
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const datasetId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!datasetId || !accessToken) {
    return NextResponse.json({ error: 'Mangler Meta Credentials' }, { status: 500 });
  }

  // Henter tidsrom fra URL-parametere (f.eks. ?start=2026-09-01T00:00:00Z&end=2026-09-02T00:00:00Z)
  const searchParams = request.nextUrl.searchParams;
  const startTime = searchParams.get('start'); 
  const endTime = searchParams.get('end');
  
  const aggregation = searchParams.get('aggregation') || 'event_match_quality';

  if (!startTime || !endTime) {
    return NextResponse.json({ error: 'Mangler start og/eller end parametere' }, { status: 400 });
  }

  const url = new URL(`https://graph.facebook.com/v26.0/${datasetId}/stats`);
  url.searchParams.append('aggregation', aggregation);
  url.searchParams.append('start_time', startTime);
  url.searchParams.append('end_time', endTime);
  url.searchParams.append('access_token', accessToken);

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store', 
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error?.message || 'Ukjent feil mot Meta API');
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Feil ved henting av tidsbegrenset Meta Stats:', error);
    return NextResponse.json(
      { error: 'Kunne ikke hente stats', details: error.message },
      { status: 500 }
    );
  }
}