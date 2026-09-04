import {
  META_CATALOG_ID,
  META_GRAPH_API_ORIGIN,
  META_GRAPH_API_VERSION
} from './metaCatalogConstants'
import { parseMetaGraphResponse } from './parseMetaGraphResponse'

export const META_LEGACY_CATALOG_APP_ID = '2031748470995074'

export async function disconnectLegacyMetaCatalogApp(input: {
  accessToken: string
  fetchImpl?: typeof fetch
}) {
  const accessToken = input.accessToken.trim()

  if (!accessToken) {
    throw new Error('CATALOG_API_TOKEN is required')
  }

  const body = new URLSearchParams({
    external_event_sources: JSON.stringify([
      META_LEGACY_CATALOG_APP_ID
    ])
  })
  const response = await (input.fetchImpl ?? fetch)(
    `${META_GRAPH_API_ORIGIN}/${META_GRAPH_API_VERSION}/${META_CATALOG_ID}/external_event_sources`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body,
      cache: 'no-store'
    }
  )
  const result = await parseMetaGraphResponse(
    response,
    'Meta Catalog API legacy app disconnect'
  )

  return {
    appId: META_LEGACY_CATALOG_APP_ID,
    catalogId: META_CATALOG_ID,
    result
  }
}
