import Link from 'next/link'
import { unstable_rethrow } from 'next/navigation'
import { connection } from 'next/server'
import { fetchStorefrontProductOptions } from '@/api/lib/products/fetchProductOptions'
import { getProductModel } from '@/lib/products/commerce/getProductModel'
import { reportOperationalError } from '@/lib/observability/reportOperationalError'
import {
  TechdownPurchaseActions,
  type TechdownPurchasePayload
} from '@/app/(techdown)/produkter/techdown/TechdownPurchaseActions'
import { TechdownSizeSelectorClient } from '@/app/(techdown)/produkter/techdown/TechdownSizeSelectorClient'
import { createSvaleSizeSelectorModel } from './svaleSizeSelectorModel'
import type { ProductModel } from '@/lib/products/productModelSchema'
import styles from '@/app/(techdown)/produkter/techdown/TechdownContent.module.css'

export function SvaleSizeSelectorFallback({
  failed = false
}: {
  failed?: boolean
}) {
  return (
    <div
      className={styles.sizeSelectorFallback}
      role={failed ? 'alert' : 'status'}
      aria-live='polite'
    >
      <span>
        {failed ?
          'Størrelsene kunne ikke lastes.'
        : 'Laster størrelser…'}
      </span>
      {failed && (
        <Link href='/produkter/utekos-svale'>
          Velg på produktsiden
        </Link>
      )}
    </div>
  )
}

function createPurchasePayload(
  product: ProductModel,
  choiceIds: ReadonlySet<string>,
  initialVariantId: string
): TechdownPurchasePayload | null {
  const variants = product.variants.flatMap(variant =>
    choiceIds.has(variant.id) ?
      [
        {
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
        }
      ]
    : []
  )

  if (
    variants.length === 0 ||
    !variants.some(variant => variant.id === initialVariantId)
  ) {
    return null
  }

  return {
    initialVariantId,
    product: {
      id: product.id,
      title: product.title,
      handle: product.handle,
      productType: product.productType,
      vendor: product.vendor,
      collections: product.collections,
      featuredImage: product.featuredImage
    },
    variants
  }
}

async function loadSvaleProductModel() {
  try {
    return await getProductModel('utekos-svale')
  } catch (error) {
    unstable_rethrow(error)
    reportOperationalError({
      error,
      event: 'svale.purchase_actions.failed',
      context: { surface: 'svale-purchase-actions' }
    })
    return null
  }
}

export async function SvaleSizeSelector() {
  await connection()

  let model: ReturnType<
    typeof createSvaleSizeSelectorModel
  > | null = null
  let purchase: TechdownPurchasePayload | null = null

  try {
    const [productOptions, productModel] = await Promise.all([
      fetchStorefrontProductOptions({
        handle: 'utekos-svale',
        selectedOptions: []
      }),
      loadSvaleProductModel()
    ])

    if (productOptions) {
      model = createSvaleSizeSelectorModel(productOptions)
    }

    if (model && productModel) {
      purchase = createPurchasePayload(
        productModel,
        new Set(model.choices.map(choice => choice.variantId)),
        model.initialVariantId
      )
    }
  } catch (error) {
    unstable_rethrow(error)
    reportOperationalError({
      error,
      event: 'svale.size_selector.failed',
      context: { surface: 'svale-size-selector' }
    })
  }

  return (
    <div className={styles.purchaseStack}>
      {model ?
        <TechdownSizeSelectorClient
          model={model}
          showSelectedPrice
          trackingLabel='Svale'
          trackingSurface='svale'
        />
      : <SvaleSizeSelectorFallback failed />}
      {purchase ?
        <TechdownPurchaseActions
          payload={purchase}
          trackingEventName='SvaleAddToCartClick'
          trackingSurface='svale'
        />
      : null}
    </div>
  )
}
