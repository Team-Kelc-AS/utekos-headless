import { OS_CARAVAN_VENUE } from '../constants/venue'

const OSM_BBOX_PAD = 0.012

export function createOsCaravanOsmEmbedUrl(): string {
  const { latitude, longitude } = OS_CARAVAN_VENUE
  const embedUrl = new URL(
    'https://www.openstreetmap.org/export/embed.html'
  )
  embedUrl.searchParams.set(
    'bbox',
    [
      longitude - OSM_BBOX_PAD,
      latitude - OSM_BBOX_PAD,
      longitude + OSM_BBOX_PAD,
      latitude + OSM_BBOX_PAD
    ]
      .map(value => value.toFixed(6))
      .join(',')
  )
  embedUrl.searchParams.set('layer', 'mapnik')
  embedUrl.searchParams.set('marker', `${latitude},${longitude}`)
  return embedUrl.toString()
}

export function createOsCaravanMapEmbedUrl(
  apiKey = process.env.GOOGLE_MAPS_KEY
): string {
  const key = apiKey?.trim()
  if (!key) {
    return createOsCaravanOsmEmbedUrl()
  }

  const embedUrl = new URL('https://www.google.com/maps/embed/v1/place')
  embedUrl.searchParams.set('key', key)
  embedUrl.searchParams.set('q', OS_CARAVAN_VENUE.embedQuery)
  embedUrl.searchParams.set('zoom', '16')
  embedUrl.searchParams.set('language', 'no')
  embedUrl.searchParams.set('region', 'NO')

  return embedUrl.toString()
}
