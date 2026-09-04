import type { MetaCatalogItemsBatchRequest } from './metaCatalogItemsBatchSchema'
import { metaCatalogItemsBatchResponseSchema } from './metaCatalogGraphResponseSchema'
import {
  META_CATALOG_ID,
  META_GRAPH_API_ORIGIN,
  META_GRAPH_API_VERSION
} from './metaCatalogConstants'
import { parseMetaGraphResponse } from './parseMetaGraphResponse'

export async function postMetaCatalogItemsBatch(input: {
  accessToken: string
  requests: readonly MetaCatalogItemsBatchRequest[]
  fetchImpl?: typeof fetch
}) {
  const accessToken = input.accessToken.trim()

  if (!accessToken) {
    throw new Error('CATALOG_API_TOKEN is required')
  }

  const body = new URLSearchParams({
    allow_upsert: 'true',
    item_type: 'PRODUCT_ITEM',
    requests: JSON.stringify(input.requests)
  })
  const response = await (input.fetchImpl ?? fetch)(
    `${META_GRAPH_API_ORIGIN}/${META_GRAPH_API_VERSION}/${META_CATALOG_ID}/items_batch`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body,
      cache: 'no-store'
    }
  )
  const result = metaCatalogItemsBatchResponseSchema.parse(
    await parseMetaGraphResponse(
      response,
      'Meta Catalog API items_batch'
    )
  )
  const validationErrors = result.validation_status.flatMap(status =>
    status.errors.map(error => ({
      id: status.retailer_id,
      message: error.message
    }))
  )

  if (validationErrors.length > 0 || result.handles.length !== 1) {
    throw new Error(
      `Meta Catalog API rejected the batch: ${JSON.stringify(validationErrors)}`
    )
  }

  return result
}
