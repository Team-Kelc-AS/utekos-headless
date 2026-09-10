import { journeyEventSchema } from './contract'
import type {
  JourneyRow,
  JourneyStore,
  JourneyTraffic
} from './journeyStore'
import { logJourneyEvent } from './logJourneyEvent'
import { readJourneyBody } from './readJourneyBody'

export type JourneyRequestDependencies = {
  store: JourneyStore
  now: () => number
  runtime: JourneyRow['runtime']
  classifyTraffic: (
    request: Request
  ) => Promise<{ classification: JourneyTraffic }>
  log?: typeof logJourneyEvent
}

export async function handleJourneyRequest(
  request: Request,
  dependencies: JourneyRequestDependencies
) {
  const respond = (
    body: Record<string, unknown>,
    status: number
  ) =>
    Response.json(body, {
      status,
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    })
  const origin = request.headers.get('origin')
  if (
    origin !== new URL(request.url).origin ||
    (request.headers.has('sec-fetch-site') &&
      request.headers.get('sec-fetch-site') !== 'same-origin')
  ) {
    return respond({ error: 'forbidden_origin' }, 403)
  }
  if (
    request.headers
      .get('content-type')
      ?.split(';')[0]
      ?.trim()
      .toLowerCase() !== 'application/json'
  ) {
    return respond({ error: 'unsupported_media_type' }, 415)
  }
  const body = await readJourneyBody(request)
  if ('error' in body)
    return respond({ error: body.error }, body.status)
  let parsed
  try {
    parsed = journeyEventSchema.safeParse(JSON.parse(body.body))
  } catch {
    return respond({ error: 'invalid_json' }, 400)
  }
  if (!parsed.success)
    return respond({ error: 'invalid_event_or_consent' }, 400)
  if (parsed.data.consent.marketing !== 'granted')
    return respond({ error: 'consent_required' }, 403)

  const now = dependencies.now()
  const eventTime = Date.parse(parsed.data.occurred_at)
  if (
    eventTime > now + 300_000 ||
    eventTime < now - 86_400_000
  ) {
    return respond({ error: 'event_time_out_of_window' }, 400)
  }
  let row: JourneyRow | undefined
  const log = dependencies.log ?? logJourneyEvent
  try {
    const traffic = await dependencies.classifyTraffic(request)
    row = {
      event: parsed.data,
      received_at: new Date(now).toISOString(),
      traffic_classification: traffic.classification,
      runtime: dependencies.runtime
    }
    const status = await dependencies.store.accept(row)
    log(row, status)
    if (status === 'conflict')
      return respond({ error: 'event_id_conflict' }, 409)
    return respond(
      { status, event_id: row.event.event_id },
      status === 'persisted' ? 202 : 200
    )
  } catch {
    if (row) log(row, 'storage_failed')
    return respond({ error: 'journey_storage_unavailable' }, 503)
  }
}
