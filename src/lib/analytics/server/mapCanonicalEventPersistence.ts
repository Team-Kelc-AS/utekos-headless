import type { CanonicalEventStoreInput } from './canonicalEventStore'

type UserDataQuality = {
  email_sha256_count: number
  has_external_id: boolean
  phone_sha256_count: number
}

type ProviderDataQuality = UserDataQuality & {
  google_event_freshness?: CanonicalEventStoreInput['dispatches'][number]['google_event_freshness']
}

export type CanonicalLedgerInsert = {
  consent: CanonicalEventStoreInput['event']['consent']
  event_id: string
  event_name: CanonicalEventStoreInput['event']['event_name']
  external_id?: string
  idempotency_key: string
  occurred_at: string
  payload: CanonicalEventStoreInput['event']
  source_url?: string
  user_data_quality: UserDataQuality
}

export type ProviderDispatchInsert = {
  consent_basis: CanonicalEventStoreInput['event']['consent']
  data_quality: ProviderDataQuality
  dispatch_mode: 'server_retry'
  event_id: string
  event_name: CanonicalEventStoreInput['event']['event_name']
  idempotency_key: string
  payload: CanonicalEventStoreInput['event']
  provider: CanonicalEventStoreInput['dispatches'][number]['provider']
  skip_reason?:
    | 'google_event_outside_72h'
    | 'missing_capi_token'
    | 'missing_client_id'
    | 'missing_google_analytics_identifier'
    | 'missing_microsoft_uet_identifier'
  status: 'pending' | 'skipped_unqualified'
}

export function mapCanonicalEventPersistence(
  input: CanonicalEventStoreInput
): {
  dispatches: ProviderDispatchInsert[]
  ledger: CanonicalLedgerInsert
} {
  const idempotencyKey = `${input.event.event_name}:${input.event.event_id}`
  const dataQuality: UserDataQuality = {
    email_sha256_count:
      input.event.user_data?.email_sha256?.length ?? 0,
    has_external_id: Boolean(input.event.external_id),
    phone_sha256_count:
      input.event.user_data?.phone_sha256?.length ?? 0
  }

  return {
    ledger: {
      consent: input.event.consent,
      event_id: input.event.event_id,
      event_name: input.event.event_name,
      ...(input.event.external_id ?
        { external_id: input.event.external_id }
      : {}),
      idempotency_key: idempotencyKey,
      occurred_at: input.event.event_time,
      payload: input.event,
      ...(input.event.page_url ?
        { source_url: input.event.page_url }
      : {}),
      user_data_quality: dataQuality
    },
    dispatches: input.dispatches.map(dispatch => {
      const providerDataQuality: ProviderDataQuality = {
        ...dataQuality,
        ...(dispatch.google_event_freshness ?
          {
            google_event_freshness:
              dispatch.google_event_freshness
          }
        : {})
      }

      if ('status' in dispatch) {
        return {
          consent_basis: input.event.consent,
          data_quality: providerDataQuality,
          dispatch_mode: dispatch.dispatch_mode,
          event_id: input.event.event_id,
          event_name: input.event.event_name,
          idempotency_key: idempotencyKey,
          payload: input.event,
          provider: dispatch.provider,
          skip_reason: dispatch.skip_reason,
          status: dispatch.status
        }
      }

      return {
        consent_basis: input.event.consent,
        data_quality: providerDataQuality,
        dispatch_mode: dispatch.dispatch_mode,
        event_id: input.event.event_id,
        event_name: input.event.event_name,
        idempotency_key: idempotencyKey,
        payload: input.event,
        provider: dispatch.provider,
        status: 'pending' as const
      }
    })
  }
}
