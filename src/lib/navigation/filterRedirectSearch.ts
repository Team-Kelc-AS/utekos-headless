import { z } from 'zod'

const attributionParameterSchema = z.enum([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'utm_id',
  'dclid',
  'epik',
  'fbclid',
  'gclid',
  'gbraid',
  'wbraid',
  'msclkid',
  'sc_click_id',
  'ScCid',
  'ttclid',
  'twclid',
  'campaign_id',
  'campaign_name',
  'adset_id',
  'adset_name',
  'ad_id',
  'ad_name',
  'hsa_cam',
  'hsa_grp',
  'hsa_ad'
])

const landingParameterSchema = z.enum([
  'variant',
  'farge',
  'storrelse',
  'kjonn'
])

export function filterRedirectSearch(
  search: string,
  destination: 'nbcc' | 'magazine' | 'landing'
): string {
  const query = search.startsWith('?') ? search.slice(1) : search
  const retained = query.split('&').filter(segment => {
    if (segment.startsWith('?')) return false
    const name = new URLSearchParams(segment).keys().next().value
    return (
      attributionParameterSchema.safeParse(name).success ||
      (destination === 'landing' &&
        landingParameterSchema.safeParse(name).success)
    )
  })

  // Keep opaque click IDs and their original URL encoding intact.
  return retained.length > 0 ? `?${retained.join('&')}` : ''
}
