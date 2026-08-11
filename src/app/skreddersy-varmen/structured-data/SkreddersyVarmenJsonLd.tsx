import { JsonLdScript } from '@/lib/seo/jsonLd/JsonLdScript'
import { buildSkreddersyVarmenJsonLd } from './buildSkreddersyVarmenJsonLd'
import type { ProductCommerceViewModel } from '@/lib/products/commerce'

export function SkreddersyVarmenJsonLd({
  commerce
}: {
  commerce: ProductCommerceViewModel
}) {
  return (
    <JsonLdScript data={buildSkreddersyVarmenJsonLd(commerce)} />
  )
}
