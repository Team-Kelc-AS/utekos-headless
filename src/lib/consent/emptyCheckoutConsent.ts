import {
  hasCookiebotExplicitResponse,
  type CookiebotApi
} from './cookiebotConsent'
import { getConsentSnapshot } from '@/lib/analytics/pageViewClientContext'
import { checkoutAttributionSnapshotSchema } from '@/lib/analytics/checkoutAttributionSnapshot'
import { parseOrderConsentFromNoteAttributes } from '@/lib/analytics/checkoutConsentSnapshot'

export function emptyCheckoutConsent(
  api: CookiebotApi | undefined
) {
  return checkoutAttributionSnapshotSchema.parse({
    schema_version: 1,
    captured_at: new Date().toISOString(),
    consent:
      hasCookiebotExplicitResponse(api) ?
        getConsentSnapshot(api?.consent)
      : parseOrderConsentFromNoteAttributes([])
  })
}
