import 'server-only'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { revalidateProductCatalog } from '@/lib/cache/revalidateProductCatalog'
import { verifyShopifyWebhook } from '@/lib/shopify/verifyWebhook'
import type {
  ProductCatalogInvalidationOptions,
  ProductCatalogInvalidationResult
} from '@/lib/cache/revalidateProductCatalog'

const shopifyProductWebhookSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    handle: z.string().trim().min(1).optional()
  })
  .passthrough()

type ShopifyProductWebhookTopic =
  | 'products/create'
  | 'products/delete'
  | 'products/update'

type ShopifyProductCacheWebhookDependencies = {
  invalidateProductCatalog?: (
    handles: readonly string[],
    productIds: readonly (string | number)[],
    options?: ProductCatalogInvalidationOptions
  ) => Promise<ProductCatalogInvalidationResult>
}

export async function handleShopifyProductCacheWebhook(
  request: Request,
  topic: ShopifyProductWebhookTopic,
  dependencies: ShopifyProductCacheWebhookDependencies = {}
) {
  const hmac = request.headers.get('x-shopify-hmac-sha256') ?? ''
  const shopifyTopic = request.headers.get('x-shopify-topic')

  let rawBody: string

  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json(
      { error: 'Failed to read request body' },
      { status: 400 }
    )
  }

  if (!verifyShopifyWebhook(rawBody, hmac)) {
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 401 }
    )
  }

  let productPayload: unknown

  try {
    productPayload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    )
  }

  const parsedProduct =
    shopifyProductWebhookSchema.safeParse(productPayload)

  if (!parsedProduct.success) {
    return NextResponse.json(
      {
        error: 'Invalid Shopify product webhook payload',
        details: parsedProduct.error.flatten()
      },
      { status: 400 }
    )
  }

  const handle = parsedProduct.data.handle
  const productId = parsedProduct.data.id
  const invalidateProductCatalog =
    dependencies.invalidateProductCatalog ??
    revalidateProductCatalog
  const invalidatedTags = await invalidateProductCatalog(
    handle ? [handle] : [],
    productId === undefined ? [] : [productId],
    { purgeLastGood: topic === 'products/delete' }
  )

  return NextResponse.json({
    success: true,
    topic,
    receivedTopic: shopifyTopic,
    productId: productId ?? null,
    handle: handle ?? null,
    invalidatedTags
  })
}
