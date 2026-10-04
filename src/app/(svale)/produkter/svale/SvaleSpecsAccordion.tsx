import { unstable_rethrow } from 'next/navigation'
import { connection } from 'next/server'
import { getProductPageContent } from '@/db/data/products/product-page-content'
import { getProductModel } from '@/lib/products/commerce/getProductModel'
import { reportOperationalError } from '@/lib/observability/reportOperationalError'
import { TechdownSpecsAccordionClient } from '@/app/(techdown)/produkter/techdown/TechdownSpecsAccordionClient'
import type {
  ProductCommerceModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

function toCommerceProduct(
  product: NonNullable<
    Awaited<ReturnType<typeof getProductModel>>
  >
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
  product: NonNullable<
    Awaited<ReturnType<typeof getProductModel>>
  >
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

function getSvaleSpecSections() {
  return getProductPageContent('utekos-svale')?.accordion
}

export async function SvaleSpecsAccordion() {
  await connection()

  const specSections = getSvaleSpecSections()

  if (!specSections?.length) return null

  let product: Awaited<ReturnType<typeof getProductModel>> = null
  try {
    product = await getProductModel('utekos-svale')
  } catch (error) {
    unstable_rethrow(error)
    reportOperationalError({
      error,
      event: 'svale.specs_accordion.failed',
      context: { surface: 'svale-specs-accordion' }
    })
  }

  if (!product) {
    return (
      <TechdownSpecsAccordionClient
        sections={specSections}
        headingId='svale-specs-heading'
        trackingSurface='svale'
      />
    )
  }

  return (
    <TechdownSpecsAccordionClient
      sections={specSections}
      product={toCommerceProduct(product)}
      variants={toPurchaseVariants(product)}
      initialVariantId={product.defaultVariantId}
      headingId='svale-specs-heading'
      trackingSurface='svale'
    />
  )
}

export function SvaleSpecsAccordionFallback() {
  const specSections = getSvaleSpecSections()

  return specSections?.length ?
      <TechdownSpecsAccordionClient
        sections={specSections}
        headingId='svale-specs-heading'
        trackingSurface='svale'
      />
    : null
}
