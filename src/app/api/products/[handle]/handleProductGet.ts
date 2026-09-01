import 'server-only'

import { getProduct } from '@/api/lib/products/getProduct'
import { reportOperationalError } from '@/lib/observability/reportOperationalError'
import type { ShopifyProduct } from 'types/product'

type ProductGetContext = {
  params: Promise<{ handle: string }>
}

type ProductGetDependencies = {
  getProduct: (handle: string) => Promise<ShopifyProduct | null>
  reportError: typeof reportOperationalError
}

const defaultDependencies: ProductGetDependencies = {
  getProduct,
  reportError: reportOperationalError
}

const PRODUCT_HANDLE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export async function handleProductGet(
  _request: Request,
  context: ProductGetContext,
  dependencies: ProductGetDependencies = defaultDependencies
): Promise<Response> {
  const { handle } = await context.params

  if (
    handle.length > 255 ||
    !PRODUCT_HANDLE_PATTERN.test(handle)
  ) {
    return Response.json(
      { error: 'invalid_product_handle' },
      { status: 400 }
    )
  }

  try {
    const product = await dependencies.getProduct(handle)

    if (!product) {
      return Response.json(
        { error: 'product_not_found' },
        { status: 404 }
      )
    }

    return Response.json(product, {
      headers: {
        'Cache-Control':
          'public, max-age=60, s-maxage=300, stale-while-revalidate=900'
      }
    })
  } catch (error) {
    dependencies.reportError({
      error,
      event: 'shopify.quick_view.fetch_failed'
    })

    return Response.json(
      { error: 'product_fetch_failed' },
      { status: 502 }
    )
  }
}
