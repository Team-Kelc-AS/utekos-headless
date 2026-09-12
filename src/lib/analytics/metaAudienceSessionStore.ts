import { z } from 'zod'
import {
  metaAudienceSchema,
  type MetaAudience
} from './metaAudience'
import {
  CLICK_ID_PARAMETERS,
  SNAPCHAT_CLICK_ID_QUERY_PARAMETER
} from './clickIdSessionStore'

export const META_AUDIENCE_SESSION_KEY =
  'utekos_meta_audience_v1'
export const META_AUDIENCE_IDLE_MS = 30 * 60 * 1000
type AudienceStorage = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
>
const storedSchema = z.strictObject({
  value: metaAudienceSchema,
  touchedAt: z.number().finite().nonnegative()
})
const boundaries = [
  ...CLICK_ID_PARAMETERS,
  SNAPCHAT_CLICK_ID_QUERY_PARAMETER,
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_id',
  'utm_content',
  'utm_term',
  'campaign_id',
  'campaign_name',
  'adset_id',
  'adset_name',
  'ad_id',
  'ad_name',
  'hsa_cam',
  'hsa_grp',
  'hsa_ad'
]

export function createMetaAudienceSessionStore(
  getStorage: () => AudienceStorage | undefined
) {
  function clear() {
    try {
      getStorage()?.removeItem(META_AUDIENCE_SESSION_KEY)
    } catch {
      /* Optional storage. */
    }
  }
  function resolve(
    pageUrl: string,
    allowed: boolean,
    now = Date.now()
  ): MetaAudience | undefined {
    if (!allowed) {
      clear()
      return undefined
    }
    let url: URL
    try {
      url = new URL(pageUrl)
    } catch {
      clear()
      return undefined
    }
    let value: MetaAudience | undefined
    if (url.searchParams.has('audience')) {
      const values = url.searchParams.getAll('audience')
      const parsed = metaAudienceSchema.safeParse(
        values.length === 1 ? values[0] : undefined
      )
      if (!parsed.success) {
        clear()
        return undefined
      }
      value = parsed.data
    } else if (
      boundaries.some(key => url.searchParams.has(key))
    ) {
      clear()
      return undefined
    } else {
      try {
        const raw = getStorage()?.getItem(
          META_AUDIENCE_SESSION_KEY
        )
        const parsed = storedSchema.safeParse(
          raw ? JSON.parse(raw) : undefined
        )
        if (
          !parsed.success ||
          now < parsed.data.touchedAt ||
          now - parsed.data.touchedAt >= META_AUDIENCE_IDLE_MS
        ) {
          clear()
          return undefined
        }
        value = parsed.data.value
      } catch {
        clear()
        return undefined
      }
    }
    try {
      getStorage()?.setItem(
        META_AUDIENCE_SESSION_KEY,
        JSON.stringify({ value, touchedAt: now })
      )
    } catch {
      /* The current URL still works without persistence. */
    }
    return value
  }
  return { clear, resolve }
}
