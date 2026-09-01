import { fetchMetaGraphJson, type MetaGraphFetch } from './fetchMetaGraphJson'
import { metaAdAccountResponseSchema } from './metaAdDeliveryInsightsSchema'
import type { MetaAdDeliveryInsightsConfig } from './metaAdDeliveryInsightsConfig'

const META_ADS_API_VERSION = 'v26.0'

export async function fetchMetaAdAccountTimezone(
  config: MetaAdDeliveryInsightsConfig,
  fetchImplementation?: MetaGraphFetch
) {
  const url = new URL(
    `https://graph.facebook.com/${META_ADS_API_VERSION}/act_${config.accountId}`
  )
  url.searchParams.set('fields', 'timezone_name')

  const response = await fetchMetaGraphJson({
    accessToken: config.accessToken,
    ...(fetchImplementation ? { fetchImplementation } : {}),
    schema: metaAdAccountResponseSchema,
    url
  })

  if (response.id !== `act_${config.accountId}`) {
    throw new Error('Meta returned an unexpected ad account')
  }

  return response.timezone_name
}
