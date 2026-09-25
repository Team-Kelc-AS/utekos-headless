import { unstable_rethrow } from 'next/navigation'
import { connection } from 'next/server'
import { PRODUCT_PAGE_CONTENT } from '@/db/data/products/product-page-content'
import { getProductModel } from '@/lib/products/commerce/getProductModel'
import { reportOperationalError } from '@/lib/observability/reportOperationalError'
import { TechdownSpecsAccordionClient } from './TechdownSpecsAccordionClient'
import type {
  ProductCommerceModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

function toCommerceProduct(
  product: NonNullable<Awaited<ReturnType<typeof getProductModel>>>
): ProductCommerceModel {
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    productType: product.productType,
    vendor: product.vendor,
    collections: product.collections
  }
}

function toPurchaseVariants(
  product: NonNullable<Awaited<ReturnType<typeof getProductModel>>>
): ProductPurchaseVariant[] {
  return product.variants.map(variant => ({
    id: variant.id,
    title: variant.title,
    barcode: variant.barcode,
    availableForSale: variant.availableForSale,
    currentlyNotInStock: variant.currentlyNotInStock,
    taxable: variant.taxable,
    selectedOptions: variant.selectedOptions,
    price: variant.price,
    image: variant.image,
    compareAtPrice: variant.compareAtPrice,
    quantityAvailable: variant.quantityAvailable,
    ...(variant.sku ? { sku: variant.sku } : {}),
    ...(variant.variantProfileData ?
      { variantProfileData: variant.variantProfileData }
    : {})
  }))
}

export async function TechdownSpecsAccordion() {
  await connection()

  const specSections =
    PRODUCT_PAGE_CONTENT['utekos-techdown'].accordion

  if (!specSections?.length) return null

  let product: Awaited<ReturnType<typeof getProductModel>> = null
  try {
    product = await getProductModel('utekos-techdown')
  } catch (error) {
    unstable_rethrow(error)
    reportOperationalError({
      error,
      event: 'techdown.specs_accordion.failed',
      context: { surface: 'techdown-specs-accordion' }
    })
  }

  if (!product) {
    return <TechdownSpecsAccordionClient sections={specSections} />
  }

  return (
    <TechdownSpecsAccordionClient
      sections={specSections}
      product={toCommerceProduct(product)}
      variants={toPurchaseVariants(product)}
      initialVariantId={product.defaultVariantId}
    />
  )
}

export function TechdownSpecsAccordionFallback() {
  const specSections =
    PRODUCT_PAGE_CONTENT['utekos-techdown'].accordion

  return specSections?.length ?
      <TechdownSpecsAccordionClient sections={specSections} />
    : null
}
