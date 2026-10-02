import { NextResponse } from 'next/server'
import { getProductModel } from '@/lib/products/commerce/getProductModel'
import { getStorefrontProductPresentations } from '@/lib/products/presentation'
import { createStickyCatalogProduct } from '@/components/commerce/StickyCTA/techdownPurchaseData'

export async function GET() {
  const products = await Promise.all(
    getStorefrontProductPresentations().map(async presentation => {
      const product = await getProductModel(presentation.publicHandle)
      return product ? createStickyCatalogProduct(product) : null
    })
  )

  return NextResponse.json(
    { products: products.filter(product => product !== null) },
    { headers: { 'Cache-Control': 'private, max-age=60' } }
  )
}
