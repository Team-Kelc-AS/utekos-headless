import Link from 'next/link'
import { unstable_rethrow } from 'next/navigation'
import { connection } from 'next/server'
import { fetchStorefrontProductOptions } from '@/api/lib/products/fetchProductOptions'
import { getProductModel } from '@/lib/products/commerce/getProductModel'
import { reportOperationalError } from '@/lib/observability/reportOperationalError'
import { TechdownPurchaseActions } from './TechdownPurchaseActions'
import type { TechdownPurchasePayload } from './TechdownPurchaseActions'
import { TechdownSizeSelectorClient } from './TechdownSizeSelectorClient'
import { createTechdownSizeSelectorModel } from './techdownSizeSelectorModel'
import type { ProductModel } from '@/lib/products/productModelSchema'
import styles from './TechdownContent.module.css'

export function TechdownSizeSelectorFallback({
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
        <Link href='/produkter/utekos-techdown'>
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

async function loadTechdownProductModel() {
  try {
    return await getProductModel('utekos-techdown')
  } catch (error) {
    unstable_rethrow(error)
    reportOperationalError({
      error,
      event: 'techdown.purchase_actions.failed',
      context: { surface: 'techdown-purchase-actions' }
    })
    return null
  }
}

export async function TechdownSizeSelector() {
  await connection()

  let model: ReturnType<
    typeof createTechdownSizeSelectorModel
  > | null = null
  let purchase: TechdownPurchasePayload | null = null

  try {
    const [productOptions, productModel] = await Promise.all([
      fetchStorefrontProductOptions({
        handle: 'utekos-techdown',
        selectedOptions: []
      }),
      loadTechdownProductModel()
    ])

    if (productOptions) {
      model = createTechdownSizeSelectorModel(productOptions)
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
      event: 'techdown.size_selector.failed',
      context: { surface: 'techdown-size-selector' }
    })
  }

  return (
    <div className={styles.purchaseStack}>
      {model ?
        <TechdownSizeSelectorClient model={model} />
      : <TechdownSizeSelectorFallback failed />}
      {purchase ?
        <TechdownPurchaseActions payload={purchase} />
      : null}
    </div>
  )
}
