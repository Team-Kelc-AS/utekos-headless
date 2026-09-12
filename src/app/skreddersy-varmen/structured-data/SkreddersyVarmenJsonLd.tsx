import { JsonLdScript } from '@/lib/seo/jsonLd/JsonLdScript'
import { buildSkreddersyVarmenJsonLd } from './buildSkreddersyVarmenJsonLd'
import type { ProductModel } from '@/lib/products/commerce'

export function SkreddersyVarmenJsonLd({
  commerce
}: {
  commerce: ProductModel
}) {
  return (
    <JsonLdScript data={buildSkreddersyVarmenJsonLd(commerce)} />
  )
}
