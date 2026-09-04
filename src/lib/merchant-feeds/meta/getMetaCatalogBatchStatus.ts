import { metaCatalogBatchStatusResponseSchema } from './metaCatalogGraphResponseSchema'
import {
  META_CATALOG_ID,
  META_GRAPH_API_ORIGIN,
  META_GRAPH_API_VERSION
} from './metaCatalogConstants'
import { parseMetaGraphResponse } from './parseMetaGraphResponse'

export async function getMetaCatalogBatchStatus(input: {
  accessToken: string
  handle: string
  fetchImpl?: typeof fetch
}) {
  const accessToken = input.accessToken.trim()
  const handle = input.handle.trim()

  if (!accessToken || !handle) {
    throw new Error(
      'CATALOG_API_TOKEN and a batch handle are required'
    )
  }

  const url = new URL(
    `${META_GRAPH_API_ORIGIN}/${META_GRAPH_API_VERSION}/${META_CATALOG_ID}/check_batch_request_status`
  )
  url.searchParams.set('handle', handle)
  url.searchParams.set('load_ids_of_invalid_requests', 'true')
  url.searchParams.set(
    'fields',
    'handle,status,warnings,warnings_total_count,errors,errors_total_count,ids_of_invalid_requests'
  )
  const response = await (input.fetchImpl ?? fetch)(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store'
  })
  const result = metaCatalogBatchStatusResponseSchema.parse(
    await parseMetaGraphResponse(
      response,
      'Meta Catalog API check_batch_request_status'
    )
  )

  const status = result.data[0]

  if (!status || result.data.length !== 1) {
    throw new Error(
      `Meta Catalog API returned ${result.data.length} batch status records`
    )
  }

  return status
}
