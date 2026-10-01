export type MetaEventMetric = {
  event_name: string
  count: number
  last_event_at: string | null
  minutes_since_last_event: number | null
}

export type MetaStatsReport = {
  time_range: { start: string; end: string }
  generated_at: string
  total_event_count: number
  event_counts: MetaEventMetric[]
  deduplication_and_coverage: unknown[]
  current_emq_and_freshness: unknown[]
}

type MetaStatsRow = { value?: unknown; count?: unknown }
type MetaStatsBucket = { start_time?: unknown; data?: unknown }
type MetaApiResponse = {
  data?: unknown
  paging?: { cursors?: { after?: string } }
  error?: { message?: string }
}

const GRAPH_API_VERSION = 'v26.0'
const MAX_STATS_PAGES = 20

function formatGraphError(
  body: MetaApiResponse,
  status: number
) {
  const message = body.error?.message
  return typeof message === 'string' ? message : (
      `Meta Graph API returned HTTP ${status}`
    )
}

async function readMetaResponse(
  url: URL
): Promise<MetaApiResponse> {
  const response = await fetch(url, { cache: 'no-store' })
  const body = (await response.json()) as MetaApiResponse

  if (!response.ok || body.error) {
    throw new Error(formatGraphError(body, response.status))
  }

  return body
}

async function readPagedStats(
  datasetId: string,
  accessToken: string,
  aggregation: string,
  start: string,
  end: string
) {
  const rows: unknown[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  for (let page = 0; page < MAX_STATS_PAGES; page += 1) {
    const url = new URL(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${datasetId}/stats`
    )
    url.searchParams.set('aggregation', aggregation)
    url.searchParams.set('start_time', start)
    url.searchParams.set('end_time', end)
    url.searchParams.set('limit', '500')
    url.searchParams.set('access_token', accessToken)
    if (cursor) url.searchParams.set('after', cursor)

    const body = await readMetaResponse(url)
    if (Array.isArray(body.data)) rows.push(...body.data)

    const nextCursor = body.paging?.cursors?.after
    if (
      typeof nextCursor !== 'string' ||
      seenCursors.has(nextCursor)
    )
      break
    seenCursors.add(nextCursor)
    cursor = nextCursor
  }

  return rows as MetaStatsBucket[]
}

async function readSpanTotalStats(
  datasetId: string,
  accessToken: string,
  start: string,
  end: string
) {
  const url = new URL(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${datasetId}/stats`
  )
  url.searchParams.set('aggregation', 'event_total_counts')
  url.searchParams.set('start_time', start)
  url.searchParams.set('end_time', end)
  url.searchParams.set('limit', '500')
  url.searchParams.set('access_token', accessToken)

  const body = await readMetaResponse(url)
  return Array.isArray(body.data) ?
      (body.data as MetaStatsBucket[])
    : []
}

function countRows(buckets: MetaStatsBucket[]) {
  const counts = new Map<string, number>()

  for (const bucket of buckets) {
    if (!Array.isArray(bucket.data)) continue
    for (const row of bucket.data as MetaStatsRow[]) {
      if (typeof row.value !== 'string') continue
      const count = Number(row.count)
      if (!Number.isFinite(count) || count < 0) continue
      counts.set(row.value, (counts.get(row.value) ?? 0) + count)
    }
  }

  return counts
}

function spanTotalBucket(buckets: MetaStatsBucket[]) {
  if (buckets.length <= 1) return buckets

  const dated = buckets
    .map(bucket => ({
      bucket,
      timestamp: parseMetaTimestamp(bucket.start_time)
    }))
    .filter(
      (
        entry
      ): entry is {
        bucket: MetaStatsBucket
        timestamp: number
      } => entry.timestamp !== null
    )

  if (dated.length === 0) return buckets.slice(0, 1)

  dated.sort((a, b) => a.timestamp - b.timestamp)
  const earliest = dated[0]
  return earliest ? [earliest.bucket] : buckets.slice(0, 1)
}

function parseMetaTimestamp(value: unknown) {
  if (typeof value !== 'string') return null
  const normalized = value.replace(
    /([+-]\d{2})(\d{2})$/,
    '$1:$2'
  )
  const timestamp = Date.parse(normalized)
  return Number.isFinite(timestamp) ? timestamp : null
}

function latestEventBuckets(buckets: MetaStatsBucket[]) {
  const latestByEvent = new Map<string, number>()

  for (const bucket of buckets) {
    const timestamp = parseMetaTimestamp(bucket.start_time)
    if (timestamp === null || !Array.isArray(bucket.data))
      continue

    for (const row of bucket.data as MetaStatsRow[]) {
      if (typeof row.value !== 'string') continue
      if (
        !Number.isFinite(Number(row.count)) ||
        Number(row.count) <= 0
      )
        continue
      latestByEvent.set(
        row.value,
        Math.max(latestByEvent.get(row.value) ?? 0, timestamp)
      )
    }
  }

  return latestByEvent
}

export function buildMetaEventMetrics(
  countBuckets: MetaStatsBucket[],
  hourlyBuckets: MetaStatsBucket[],
  now: Date
): MetaEventMetric[] {
  // Meta defines event_total_counts as the total for the whole requested
  // interval. Cursor pages can repeat that aggregate as decreasing suffix
  // totals, so summing pages inflates the result.
  const counts = countRows(spanTotalBucket(countBuckets))
  const latestByEvent = latestEventBuckets(hourlyBuckets)
  const nowMs = now.getTime()

  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([event_name, count]) => {
      const lastEventMs = latestByEvent.get(event_name)
      const isObserved =
        lastEventMs !== undefined && lastEventMs <= nowMs

      return {
        event_name,
        count,
        last_event_at:
          isObserved ?
            new Date(lastEventMs).toISOString()
          : null,
        minutes_since_last_event:
          isObserved ?
            Math.floor((nowMs - lastEventMs) / 60_000)
          : null
      }
    })
}

export async function fetchMetaStatsReport(
  start: string,
  end: string
): Promise<MetaStatsReport> {
  const datasetId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const accessToken = process.env.META_ACCESS_TOKEN

  if (!datasetId || !accessToken) {
    throw new Error('Mangler Meta Credentials i .env')
  }

  const qualityUrl = new URL(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/dataset_quality`
  )
  qualityUrl.searchParams.set('dataset_id', datasetId)
  qualityUrl.searchParams.set(
    'fields',
    'web{event_name,event_match_quality{composite_score,match_key_feedback,diagnostics},event_coverage,data_freshness,dedupe_key_feedback}'
  )
  qualityUrl.searchParams.set('access_token', accessToken)

  const [
    processingBuckets,
    countBuckets,
    hourlyBuckets,
    qualityBody
  ] = await Promise.all([
    readPagedStats(
      datasetId,
      accessToken,
      'event_processing_results',
      start,
      end
    ),
    readSpanTotalStats(datasetId, accessToken, start, end),
    readPagedStats(datasetId, accessToken, 'event', start, end),
    readMetaResponse(qualityUrl)
  ])

  const eventCounts = buildMetaEventMetrics(
    countBuckets,
    hourlyBuckets,
    new Date()
  )
  const quality = qualityBody as MetaApiResponse & {
    web?: unknown
  }

  return {
    time_range: { start, end },
    generated_at: new Date().toISOString(),
    total_event_count: eventCounts.reduce(
      (total, event) => total + event.count,
      0
    ),
    event_counts: eventCounts,
    deduplication_and_coverage: processingBuckets,
    current_emq_and_freshness:
      Array.isArray(quality.web) ? quality.web : []
  }
}

function escapeTableCell(value: unknown) {
  return String(value ?? '–')
    .replaceAll('|', '\\|')
    .replaceAll('\n', ' ')
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ?
      (value as Record<string, unknown>)
    : {}
}

function percentage(value: unknown) {
  const record = asRecord(value)
  return typeof record.percentage === 'number' ?
      `${record.percentage}%`
    : '–'
}

export function renderMetaStatsMarkdown(
  report: MetaStatsReport
) {
  const lines = [
    '# Meta-statistikk',
    '',
    `- **Tidsrom (UTC):** ${report.time_range.start} – ${report.time_range.end}`,
    `- **Hentet (UTC):** ${report.generated_at}`,
    `- **Totalt antall events:** ${report.total_event_count}`,
    '',
    '## Events i valgt tidsrom',
    '',
    'Meta grupperer disse statistikkene per time. «Minutter siden» regnes fra starten på siste timebøtte med event, og er derfor et estimat (inntil 59 minutter eldre enn selve eventet).',
    '',
    '| Event | Antall | Siste aktive timebøtte (UTC) | Minutter siden (ca.) |',
    '| --- | ---: | --- | ---: |'
  ]

  if (report.event_counts.length === 0) {
    lines.push('| Ingen events i perioden | 0 | – | – |')
  } else {
    for (const event of report.event_counts) {
      lines.push(
        `| ${escapeTableCell(event.event_name)} | ${event.count} | ${escapeTableCell(event.last_event_at ?? 'Ikke observert')} | ${event.minutes_since_last_event ?? '–'} |`
      )
    }
  }

  lines.push(
    '',
    '## Event-behandling per time',
    '',
    '| Time (UTC) | Events rapportert av Meta |',
    '| --- | --- |'
  )
  for (const item of report.deduplication_and_coverage) {
    const bucket = asRecord(item)
    const names =
      Array.isArray(bucket.data) ?
        bucket.data
          .map(row => escapeTableCell(asRecord(row).event))
          .join(', ')
      : '–'
    lines.push(
      `| ${escapeTableCell(bucket.start_time)} | ${names || '–'} |`
    )
  }
  if (report.deduplication_and_coverage.length === 0)
    lines.push('| – | Ingen data fra Meta i perioden |')

  lines.push(
    '',
    '## Event-kvalitet, dekning og ferskhet',
    '',
    '| Event | EMQ | Eventdekning | Ferskhet |',
    '| --- | ---: | --- | --- |'
  )

  for (const item of report.current_emq_and_freshness) {
    const event = asRecord(item)
    const matchQuality = asRecord(event.event_match_quality)
    lines.push(
      `| ${escapeTableCell(event.event_name)} | ${escapeTableCell(matchQuality.composite_score)} | ${escapeTableCell(JSON.stringify(event.event_coverage))} | ${escapeTableCell(JSON.stringify(event.data_freshness))} |`
    )
  }
  if (report.current_emq_and_freshness.length === 0)
    lines.push('| – | – | – | Ingen kvalitetsdata returnert |')

  lines.push(
    '',
    '### Match key-feedback',
    '',
    '| Event | Identifier | Dekning | Potensiell ACR-økning |',
    '| --- | --- | ---: | ---: |'
  )

  let matchKeyRows = 0
  for (const item of report.current_emq_and_freshness) {
    const event = asRecord(item)
    const quality = asRecord(event.event_match_quality)
    if (!Array.isArray(quality.match_key_feedback)) continue
    for (const entry of quality.match_key_feedback) {
      const feedback = asRecord(entry)
      lines.push(
        `| ${escapeTableCell(event.event_name)} | ${escapeTableCell(feedback.identifier)} | ${percentage(feedback.coverage)} | ${percentage(feedback.potential_aly_acr_increase)} |`
      )
      matchKeyRows += 1
    }
  }
  if (matchKeyRows === 0)
    lines.push(
      '| – | Ingen match key-feedback returnert | – | – |'
    )

  lines.push(
    '',
    '### Dedupliserings-feedback',
    '',
    '| Event | Nøkkel | Browser-events med nøkkel | Server-events med nøkkel | Browser-dekning fra nøkkelen |',
    '| --- | --- | ---: | ---: | ---: |'
  )

  let dedupeRows = 0
  for (const item of report.current_emq_and_freshness) {
    const event = asRecord(item)
    if (!Array.isArray(event.dedupe_key_feedback)) continue
    for (const entry of event.dedupe_key_feedback) {
      const feedback = asRecord(entry)
      lines.push(
        `| ${escapeTableCell(event.event_name)} | ${escapeTableCell(feedback.dedupe_key)} | ${percentage(feedback.browser_events_with_dedupe_key)} | ${percentage(feedback.server_events_with_dedupe_key)} | ${percentage(feedback.overall_browser_coverage_from_dedupe_key)} |`
      )
      dedupeRows += 1
    }
  }
  if (dedupeRows === 0)
    lines.push(
      '| – | Ingen dedupliserings-feedback returnert | – | – | – |'
    )

  lines.push(
    '',
    '### Diagnostics',
    '',
    '| Event | Diagnostics fra Meta |',
    '| --- | --- |'
  )
  let diagnosticsRows = 0
  for (const item of report.current_emq_and_freshness) {
    const event = asRecord(item)
    const quality = asRecord(event.event_match_quality)
    if (quality.diagnostics === undefined) continue
    lines.push(
      `| ${escapeTableCell(event.event_name)} | ${escapeTableCell(JSON.stringify(quality.diagnostics))} |`
    )
    diagnosticsRows += 1
  }
  if (diagnosticsRows === 0)
    lines.push('| – | Ingen diagnostics returnert |')

  return `${lines.join('\n')}\n`
}
