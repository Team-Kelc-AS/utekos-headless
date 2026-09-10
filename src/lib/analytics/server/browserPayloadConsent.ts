import { z } from 'zod'
import { consentSnapshotSchema } from '../canonicalEventEnvelope'

const schema = z.object({ consent: consentSnapshotSchema })
export function browserPayloadConsentDenied(payload: unknown) {
  const result = schema.safeParse(payload)
  return (
    result.success &&
    result.data.consent.analytics !== 'granted' &&
    result.data.consent.marketing !== 'granted'
  )
}
