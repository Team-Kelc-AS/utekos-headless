import { JsonLdScript } from '@/lib/seo/jsonLd/JsonLdScript'
import { buildComfyrobeJsonLd } from './buildComfyrobeJsonLd'
import type { ShopifyProduct } from 'types/product'

export function ComfyrobeJsonLd({
  product
}: {
  product: ShopifyProduct
}) {
  return <JsonLdScript data={buildComfyrobeJsonLd(product)} />
}
