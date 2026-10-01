// app/api/meta-stats/route.ts
// 
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const datasetId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!datasetId || !accessToken) {
    return NextResponse.json({ error: 'Mangler Meta Credentials i .env' }, { status: 500 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startTime = searchParams.get('start'); 
  const endTime = searchParams.get('end');

  if (!startTime || !endTime) {
    return NextResponse.json({ error: 'Mangler start og/eller end parametere i URL' }, { status: 400 });
  }

  try {
    // 1. Hent tidsbestemt Deduplisering og Coverage (CAPI vs Browser)
    // Bruker 'event_processing_results' (hva ble deduplisert/droppet) 
    const statsUrl = new URL(`https://graph.facebook.com/v26.0/${datasetId}/stats`);
    statsUrl.searchParams.append('aggregation', 'event_processing_results'); 
    statsUrl.searchParams.append('start_time', startTime);
    statsUrl.searchParams.append('end_time', endTime);
    statsUrl.searchParams.append('access_token', accessToken);

    // 2. Hent nåværende (rullerende) status for EMQ og Freshness
    // Dette kan IKKE tidsfiltreres hos Meta.
    const qualityUrl = new URL(`https://graph.facebook.com/v26.0/${datasetId}`);
    qualityUrl.searchParams.append('fields', 'emq_diagnostics,integration_quality');
    qualityUrl.searchParams.append('access_token', accessToken);

    // Kjør begge kallene parallelt for best ytelse
    const [statsRes, qualityRes] = await Promise.all([
      fetch(statsUrl.toString(), { cache: 'no-store' }),
      fetch(qualityUrl.toString(), { next: { revalidate: 3600 } }) // Cacher EMQ i én time
    ]);

    const statsData = await statsRes.json();
    const qualityData = await qualityRes.json();

    // Håndter feil fra Meta
    if (statsData.error) throw new Error(`Stats Error: ${statsData.error.message}`);
    if (qualityData.error) throw new Error(`Quality Error: ${qualityData.error.message}`);

    // Returner alt samlet i én fin JSON
    return NextResponse.json({
      time_range: { start: startTime, end: endTime },
      // Dette gir deg nøyaktig antall prosesserte vs. dedupliserte hendelser for angitt tid
      deduplication_and_coverage: statsData.data, 
      // Dette gir deg nåværende Event Match Quality score og Freshness-status for serveren
      current_emq_and_freshness: qualityData 
    });

  } catch (error: any) {
    console.error('Meta API Feil:', error.message);
    return NextResponse.json(
      { error: 'Kunne ikke hente Meta-data', details: error.message },
      { status: 500 }
    );
  }
}