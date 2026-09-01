import { resolveProductJsonLdData } from '../utils/resolveProductJsonLdData'
import { reportOperationalError } from '@/lib/observability/reportOperationalError'
import { JsonLdScript } from '@/lib/seo/jsonLd/JsonLdScript'

export async function ProductJsonLd({
  handle
}: {
  handle: string
}) {
  const data = await resolveProductJsonLdData(handle, {
    onError: (error, context) => {
      reportOperationalError({
        error,
        event: 'pdp.product_json_ld.failed',
        context: { surface: 'product-json-ld' }
      })
      console.warn(
        JSON.stringify({
          event: 'pdp.product_json_ld.omitted',
          level: 'WARN',
          error:
            error instanceof Error ?
              error.message
            : String(error),
          context: { handle: context.publicHandle }
        })
      )
    }
  })

  if (!data) return null

  return <JsonLdScript data={data} />
}
