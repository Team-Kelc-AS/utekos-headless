import {
  metaCatalogProductsReadbackResponseSchema,
  type MetaCatalogProductReadback
} from './metaCatalogProductReadbackSchema'
import {
  META_CATALOG_ID,
  META_GRAPH_API_ORIGIN,
  META_GRAPH_API_VERSION
} from './metaCatalogConstants'
import { parseMetaGraphResponse } from './parseMetaGraphResponse'

const fields = [
  'id',
  'retailer_id',
  'name',
  'category',
  'fb_product_category',
  'gtin',
  'manufacturer_part_number',
  'availability',
  'visibility',
  'url',
  'image_url',
  'additional_image_urls',
  'images',
  'image_fetch_status'
].join(',')

export async function getMetaCatalogProductReadback(input: {
  accessToken: string
  fetchImpl?: typeof fetch
}) {
  const accessToken = input.accessToken.trim()

  if (!accessToken) {
    throw new Error('CATALOG_API_TOKEN is required')
  }

  const products: MetaCatalogProductReadback[] = []
  let after: string | undefined

  do {
    const url = new URL(
      `${META_GRAPH_API_ORIGIN}/${META_GRAPH_API_VERSION}/${META_CATALOG_ID}/products`
    )
    url.searchParams.set('fields', fields)
    url.searchParams.set('limit', '100')

    if (after) url.searchParams.set('after', after)

    const response = await (input.fetchImpl ?? fetch)(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store'
    })
    const result =
      metaCatalogProductsReadbackResponseSchema.parse(
        await parseMetaGraphResponse(
          response,
          'Meta Catalog API product readback'
        )
      )

    products.push(...result.data)
    after =
      result.paging?.next ?
        result.paging.cursors?.after
      : undefined
  } while (after)

  return products
}
