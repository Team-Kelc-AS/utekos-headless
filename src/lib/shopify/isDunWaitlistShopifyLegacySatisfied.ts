import 'server-only'

import {
  executeDunWaitlistShopifyQueueQuery,
  type DunWaitlistShopifyQueueQueryExecutor
} from './dunWaitlistShopifyQueueDb'

const LEGACY_PROVIDER = 'shopify'
const LEGACY_EVENT_TYPE = 'dun_waitlist_customer_sync'

export type IsDunWaitlistShopifyLegacySatisfiedDependencies = {
  executeQuery: DunWaitlistShopifyQueueQueryExecutor
}

const defaultDependencies: IsDunWaitlistShopifyLegacySatisfiedDependencies =
  {
    executeQuery: executeDunWaitlistShopifyQueueQuery
  }

const LEGACY_SUCCEEDED_QUERY = `
  select 1 as found
  from ops.integration_events
  where provider = $1
    and event_type = $2
    and status = 'succeeded'
    and payload ->> 'lead_id' = $3::text
  limit 1
`

export async function isDunWaitlistShopifyLegacySatisfied(
  leadId: string,
  dependencies: IsDunWaitlistShopifyLegacySatisfiedDependencies =
    defaultDependencies
): Promise<boolean> {
  const rows = await dependencies.executeQuery<{ found: number }>(
    LEGACY_SUCCEEDED_QUERY,
    [LEGACY_PROVIDER, LEGACY_EVENT_TYPE, leadId]
  )

  return rows.length === 1
}
