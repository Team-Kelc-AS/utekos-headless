import type { MetaAdDeliveryInsightsConfig } from './metaAdDeliveryInsightsConfig'
import { buildMetaAdCreativeDestinations } from './buildMetaAdCreativeDestinations'
import type { MetaAdCreativeDestination } from './metaAdCreativeDestination'
import {
  metaAdCreativeAccountAdsResponseSchema,
  metaAdCreativeResponseSchema,
  type MetaAdCreativeAccountAd
} from './metaAdCreativeDestinationSchema'
import {
  fetchMetaGraphJson,
  type MetaGraphFetch
} from './fetchMetaGraphJson'

const META_ADS_API_VERSION = 'v25.0'
const META_AD_FIELDS =
  'id,created_time,updated_time,effective_status,creative{id}'
const META_CREATIVE_FIELDS = [
  'id',
  'object_story_spec',
  'asset_feed_spec',
  'url_tags',
  'object_url',
  'template_url_spec',
  'product_set_id',
  'effective_object_story_id'
].join(',')
const META_ADS_MAX_PAGES = 100

function accountAdsUrl(accountId: string, after?: string) {
  const url = new URL(
    `https://graph.facebook.com/${META_ADS_API_VERSION}/act_${accountId}/ads`
  )
  url.searchParams.set('fields', META_AD_FIELDS)
  url.searchParams.set('limit', '500')
  if (after) url.searchParams.set('after', after)
  return url
}

function creativeUrl(creativeId: string) {
  const url = new URL(
    `https://graph.facebook.com/${META_ADS_API_VERSION}/${creativeId}`
  )
  url.searchParams.set('fields', META_CREATIVE_FIELDS)
  return url
}

async function fetchAccountAds(
  config: MetaAdDeliveryInsightsConfig,
  fetchImplementation?: MetaGraphFetch
) {
  const ads: MetaAdCreativeAccountAd[] = []
  const seenCursors = new Set<string>()
  let after: string | undefined

  for (let page = 0; page < META_ADS_MAX_PAGES; page += 1) {
    const response = await fetchMetaGraphJson({
      accessToken: config.accessToken,
      ...(fetchImplementation ? { fetchImplementation } : {}),
      schema: metaAdCreativeAccountAdsResponseSchema,
      url: accountAdsUrl(config.accountId, after)
    })
    ads.push(...response.data)

    const nextCursor = response.paging?.cursors?.after
    if (!nextCursor) return ads
    if (seenCursors.has(nextCursor)) {
      throw new Error('Meta repeated an Ads pagination cursor')
    }
    seenCursors.add(nextCursor)
    after = nextCursor
  }

  throw new Error('Meta ads exceeded the pagination limit')
}

export async function fetchMetaAdCreativeDestinations(
  config: MetaAdDeliveryInsightsConfig,
  fetchImplementation?: MetaGraphFetch
): Promise<MetaAdCreativeDestination[]> {
  const ads = await fetchAccountAds(config, fetchImplementation)
  if (ads.length === 0) {
    throw new Error(
      'Meta returned no ads for creative destination sync'
    )
  }

  const destinations: MetaAdCreativeDestination[] = []
  for (const ad of ads) {
    const creative = await fetchMetaGraphJson({
      accessToken: config.accessToken,
      ...(fetchImplementation ? { fetchImplementation } : {}),
      schema: metaAdCreativeResponseSchema,
      url: creativeUrl(ad.creative.id)
    })
    destinations.push(
      ...buildMetaAdCreativeDestinations({
        accountId: config.accountId,
        ad,
        creative
      })
    )
  }

  return destinations
}
