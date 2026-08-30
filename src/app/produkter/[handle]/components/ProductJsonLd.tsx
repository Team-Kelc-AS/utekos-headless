import { captureException } from '@sentry/nextjs'
import { resolveProductJsonLdData } from '../utils/resolveProductJsonLdData'
import { JsonLdScript } from '@/lib/seo/jsonLd/JsonLdScript'

export async function ProductJsonLd({
  handle
}: {
  handle: string
}) {
  const data = await resolveProductJsonLdData(handle, {
    onError: (error, context) => {
      captureException(error, {
        tags: {
          surface: 'product-json-ld',
          handle: context.storefrontLookupHandle
        }
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
