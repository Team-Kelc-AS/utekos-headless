import { flattenConnection } from '@shopify/hydrogen-react/flatten-connection'
import { getFeaturedProducts } from '@/api/lib/products/getFeaturedProducts'
import { NewProductLaunchSection } from '@/components/frontpage/components/TechDownCampaign/NewProductLaunchSection'
import { getProductWithoutSmallSize } from '@/components/products/getProductWithoutSmallSize'
import { connection } from 'next/server'

export async function AsyncProductLaunchWrapper() {
  await connection()
  const featuredProducts = await getFeaturedProducts()

  const techDownProduct = featuredProducts?.find(
    product => product.handle === 'utekos-techdown'
  )

  if (!techDownProduct) {
    return null
  }

  const product = getProductWithoutSmallSize(techDownProduct)
  const variants = flattenConnection(product.variants)
  const selectedVariant =
    product.selectedOrFirstAvailableVariant
    ?? variants.find(variant => variant.availableForSale)
    ?? variants[0]
    ?? null

  if (!selectedVariant) {
    return null
  }

  return (
    <NewProductLaunchSection
      product={product}
      selectedVariant={selectedVariant}
    />
  )
}
