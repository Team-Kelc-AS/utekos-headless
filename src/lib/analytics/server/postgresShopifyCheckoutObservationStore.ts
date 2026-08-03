import 'server-only'
import { getPostgresClient } from '@/lib/db/getPostgresClient'
import type { ShopifyCheckoutObservation } from '../shopifyCheckoutObservationContract'
import { createShopifyCheckoutObservationIdempotencyKey } from './createShopifyCheckoutObservationIdempotencyKey'
import { createShopifyCheckoutObservationPayloadSha256 } from './createShopifyCheckoutObservationPayloadSha256'
import type { ShopifyCheckoutObservationStore } from './shopifyCheckoutObservationStore'

function getTrackingSql() {
  const trackingSql = getPostgresClient()

  if (!trackingSql) {
    throw new Error('Missing tracking database connection string')
  }

  return trackingSql
}

export const postgresShopifyCheckoutObservationStore: ShopifyCheckoutObservationStore =
  {
    persist: async (observation: ShopifyCheckoutObservation) => {
      const idempotencyKey =
        createShopifyCheckoutObservationIdempotencyKey(observation)
      const payloadSha256 =
        createShopifyCheckoutObservationPayloadSha256(observation)
      const checkoutToken =
        observation.eventName === 'alert_displayed' ?
          null
        : observation.checkoutToken
      const currencyCode =
        observation.eventName === 'alert_displayed' ?
          null
        : observation.commerce.currencyCode
      const commerceValue =
        observation.eventName === 'alert_displayed' ?
          null
        : observation.commerce.value
      const itemQuantity =
        observation.eventName === 'alert_displayed' ?
          null
        : observation.commerce.itemQuantity
      const alertType =
        observation.eventName === 'alert_displayed' ?
          observation.alert.type
        : null

      const rows = await getTrackingSql()`
        insert into ops.shopify_checkout_observations (
          idempotency_key,
          payload_sha256,
          contract_name,
          schema_version,
          source,
          verification_status,
          event_name,
          event_id,
          event_sequence,
          occurred_at,
          analytics_processing_allowed,
          marketing_allowed,
          preferences_processing_allowed,
          sale_of_data_allowed,
          checkout_token,
          currency_code,
          commerce_value,
          item_quantity,
          alert_type
        ) values (
          ${idempotencyKey},
          ${payloadSha256},
          ${observation.contract},
          ${observation.schemaVersion},
          ${observation.source},
          ${observation.verificationStatus},
          ${observation.eventName},
          ${observation.eventId},
          ${observation.eventSequence},
          ${observation.occurredAt},
          ${observation.privacy.analyticsProcessingAllowed},
          ${observation.privacy.marketingAllowed},
          ${observation.privacy.preferencesProcessingAllowed},
          ${observation.privacy.saleOfDataAllowed},
          ${checkoutToken},
          ${currencyCode},
          ${commerceValue},
          ${itemQuantity},
          ${alertType}
        )
        on conflict (idempotency_key) do update
        set
          observation_count =
            ops.shopify_checkout_observations.observation_count + 1,
          last_observed_at = statement_timestamp(),
          updated_at = statement_timestamp()
        where
          ops.shopify_checkout_observations.payload_sha256 =
            excluded.payload_sha256
        returning observation_count
      `

      const observationCount = rows[0]?.observation_count

      if (observationCount === undefined) {
        return { status: 'conflict', observationCount: 1 }
      }

      if (
        typeof observationCount !== 'number'
        || !Number.isInteger(observationCount)
        || observationCount < 1
      ) {
        throw new Error('Invalid checkout observation replay count')
      }

      return {
        status: observationCount === 1 ? 'inserted' : 'duplicate',
        observationCount
      }
    }
  }
