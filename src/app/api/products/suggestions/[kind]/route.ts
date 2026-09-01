import { getAccessoryProducts } from '@/api/lib/products/getAccessoryProducts'
import { getRecommendedProducts } from '@/api/lib/products/getRecommendedProducts'

export async function GET(
  _request: Request,
  context: { params: Promise<{ kind: string }> }
) {
  const { kind } = await context.params

  const products =
    kind === 'accessory' ?
      await getAccessoryProducts()
    : kind === 'recommended' ?
      await getRecommendedProducts()
    : null

  if (!products) {
    return Response.json(
      { error: 'invalid_suggestion_kind' },
      { status: 400 }
    )
  }

  return Response.json(products, {
    headers: {
      'Cache-Control':
        'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400'
    }
  })
}
