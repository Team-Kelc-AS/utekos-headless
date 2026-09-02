import { createHash } from 'node:crypto'
import type { CanonicalEventEnvelope } from '../canonicalEventEnvelope'
import {
  canonicalMetaAppEventSchema,
  canonicalMetaOfflineEventSchema,
  type CanonicalMetaAppEvent,
  type CanonicalMetaOfflineEvent
} from '../metaNonWebCanonicalEvent'
import {
  metaNonWebEventIngestSchema,
  type MetaNonWebEventIngest
} from '../metaNonWebIngestContract'
import { resolveCanonicalEnvironment } from './resolveCanonicalEnvironment'

const MAX_META_EVENT_AGE_SECONDS = 7 * 24 * 60 * 60
const MAX_META_EVENT_FUTURE_SKEW_SECONDS = 5 * 60

export class MetaNonWebEventTimeError extends Error {
  constructor() {
    super('meta_non_web_event_time_outside_window')
    this.name = 'MetaNonWebEventTimeError'
  }
}

function deterministicCanonicalEventId(
  input: MetaNonWebEventIngest
) {
  const hash = createHash('sha256')
    .update(
      `utekos:meta:${input.source_type}:${input.event.event_name}:${input.event.event_id}`
    )
    .digest()
  const bytes = Uint8Array.from(hash.subarray(0, 16))
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = [...bytes]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

function assertMetaEventTime(eventTime: number, now: Date) {
  const nowSeconds = Math.floor(now.getTime() / 1000)

  if (
    eventTime < nowSeconds - MAX_META_EVENT_AGE_SECONDS ||
    eventTime > nowSeconds + MAX_META_EVENT_FUTURE_SKEW_SECONDS
  ) {
    throw new MetaNonWebEventTimeError()
  }
}

export function normalizeMetaNonWebIngestEvent(
  rawInput: unknown,
  dependencies: {
    environment?: CanonicalEventEnvelope['environment']
    now?: Date
  } = {}
): CanonicalMetaAppEvent | CanonicalMetaOfflineEvent {
  const input = metaNonWebEventIngestSchema.parse(rawInput)
  const now = dependencies.now ?? new Date()
  const eventTime = new Date(
    input.event.event_time * 1000
  ).toISOString()

  assertMetaEventTime(input.event.event_time, now)

  const base = {
    schema_version: 1 as const,
    event_id: deterministicCanonicalEventId(input),
    event_time: eventTime,
    source: 'server' as const,
    environment:
      dependencies.environment ?? resolveCanonicalEnvironment(),
    consent: input.consent,
    ...(input.event.user_data.external_id ?
      { external_id: input.event.user_data.external_id }
    : {}),
    ...((
      input.event.user_data.email_sha256 ||
      input.event.user_data.phone_sha256 ||
      input.event.user_data.fb_login_id
    ) ?
      {
        user_data: {
          ...(input.event.user_data.email_sha256 ?
            { email_sha256: input.event.user_data.email_sha256 }
          : {}),
          ...(input.event.user_data.phone_sha256 ?
            { phone_sha256: input.event.user_data.phone_sha256 }
          : {}),
          ...(input.event.user_data.fb_login_id ?
            {
              facebook_login_id:
                input.event.user_data.fb_login_id
            }
          : {})
        }
      }
    : {})
  }

  if (input.source_type === 'app') {
    return canonicalMetaAppEventSchema.parse({
      ...base,
      event_name: 'meta_app_event',
      meta_event: input.event
    })
  }

  return canonicalMetaOfflineEventSchema.parse({
    ...base,
    event_name: 'meta_offline_event',
    meta_event: input.event
  })
}
