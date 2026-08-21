import {
  campaignAttributionValueSchema,
  parseCampaignAttribution,
  type CampaignAttribution
} from './campaignAttribution'
import { CLICK_ID_PARAMETERS } from './clickIdSessionStore'

export const CAMPAIGN_ATTRIBUTION_SESSION_KEY =
  'utekos_campaign_attribution'
export const CAMPAIGN_ATTRIBUTION_LOCAL_KEY =
  'utekos_campaign_attribution_v1'

const CAMPAIGN_ATTRIBUTION_TTL_MS = 90 * 24 * 60 * 60 * 1000
const ATTRIBUTION_BOUNDARY_PARAMETERS = [
  ...CLICK_ID_PARAMETERS,
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term'
] as const

type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

type DurableCampaignAttribution = {
  attribution: CampaignAttribution
  updatedAt: string
}

function getDefaultStorage(
  storageName: 'localStorage' | 'sessionStorage'
): StorageLike | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    return window[storageName]
  } catch {
    return undefined
  }
}

function readStoredAttribution(
  storage: StorageLike | undefined,
  key: string
) {
  if (!storage) return undefined

  try {
    const raw = storage.getItem(key)
    return raw ?
        parseCampaignAttribution(JSON.parse(raw))
      : undefined
  } catch {
    return undefined
  }
}

function readDurableAttribution(
  storage: StorageLike | undefined,
  nowMs: number
) {
  if (!storage) return undefined

  try {
    const raw = storage.getItem(CAMPAIGN_ATTRIBUTION_LOCAL_KEY)
    if (!raw) return undefined

    const parsed = JSON.parse(
      raw
    ) as Partial<DurableCampaignAttribution>
    const updatedAtMs = Date.parse(
      String(parsed.updatedAt ?? '')
    )
    if (
      !Number.isFinite(updatedAtMs) ||
      nowMs - updatedAtMs > CAMPAIGN_ATTRIBUTION_TTL_MS
    ) {
      storage.removeItem(CAMPAIGN_ATTRIBUTION_LOCAL_KEY)
      return undefined
    }

    return parseCampaignAttribution(parsed.attribution)
  } catch {
    return undefined
  }
}

function readUrlAttribution(searchParams: URLSearchParams) {
  const explicitCampaignName =
    campaignAttributionValueSchema.safeParse(
      searchParams.get('campaign_name')
    )
  const utmCampaignName =
    campaignAttributionValueSchema.safeParse(
      searchParams.get('utm_campaign')
    )

  return parseCampaignAttribution({
    campaign_id: searchParams.get('campaign_id'),
    campaign_name:
      explicitCampaignName.success ? explicitCampaignName.data
      : utmCampaignName.success ? utmCampaignName.data
      : undefined,
    adset_id: searchParams.get('adset_id'),
    adset_name: searchParams.get('adset_name'),
    ad_id: searchParams.get('ad_id'),
    ad_name: searchParams.get('ad_name')
  })
}

function hasFreshAttributionBoundary(
  searchParams: URLSearchParams
) {
  return ATTRIBUTION_BOUNDARY_PARAMETERS.some(parameter =>
    searchParams.has(parameter)
  )
}

function persistAttribution(
  sessionStorageLike: StorageLike | undefined,
  localStorageLike: StorageLike | undefined,
  attribution: CampaignAttribution,
  nowMs: number
) {
  try {
    sessionStorageLike?.setItem(
      CAMPAIGN_ATTRIBUTION_SESSION_KEY,
      JSON.stringify(attribution)
    )
  } catch {
    // Shopify cart attributes remain the cross-domain source of truth.
  }

  try {
    localStorageLike?.setItem(
      CAMPAIGN_ATTRIBUTION_LOCAL_KEY,
      JSON.stringify({
        attribution,
        updatedAt: new Date(nowMs).toISOString()
      } satisfies DurableCampaignAttribution)
    )
  } catch {
    // Storage can be unavailable in privacy mode.
  }
}

function clearAttribution(
  sessionStorageLike: StorageLike | undefined,
  localStorageLike: StorageLike | undefined
) {
  try {
    sessionStorageLike?.removeItem(
      CAMPAIGN_ATTRIBUTION_SESSION_KEY
    )
  } catch {
    // Storage can be unavailable in privacy mode.
  }

  try {
    localStorageLike?.removeItem(CAMPAIGN_ATTRIBUTION_LOCAL_KEY)
  } catch {
    // Storage can be unavailable in privacy mode.
  }
}

export function resolveCampaignAttribution(
  pageUrl: string,
  sessionStorageLike:
    | StorageLike
    | undefined = getDefaultStorage('sessionStorage'),
  localStorageLike: StorageLike | undefined = getDefaultStorage(
    'localStorage'
  ),
  nowMs: number = Date.now()
): CampaignAttribution | undefined {
  let searchParams: URLSearchParams

  try {
    searchParams = new URL(pageUrl).searchParams
  } catch {
    return undefined
  }

  const fromUrl = readUrlAttribution(searchParams)

  if (fromUrl) {
    persistAttribution(
      sessionStorageLike,
      localStorageLike,
      fromUrl,
      nowMs
    )
    return fromUrl
  }

  if (hasFreshAttributionBoundary(searchParams)) {
    clearAttribution(sessionStorageLike, localStorageLike)
    return undefined
  }

  const fromSession = readStoredAttribution(
    sessionStorageLike,
    CAMPAIGN_ATTRIBUTION_SESSION_KEY
  )
  if (fromSession) return fromSession

  const fromLocal = readDurableAttribution(
    localStorageLike,
    nowMs
  )
  if (!fromLocal) return undefined

  try {
    sessionStorageLike?.setItem(
      CAMPAIGN_ATTRIBUTION_SESSION_KEY,
      JSON.stringify(fromLocal)
    )
  } catch {
    // Storage can be unavailable in privacy mode.
  }

  return fromLocal
}

export type { CampaignAttribution } from './campaignAttribution'
