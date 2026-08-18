'use client'

import { useQuery } from '@tanstack/react-query'
import { FREE_SHIPPING_THRESHOLD } from '@/api/constants'
import {
  accessoryProductsOptions,
  recommendedProductsOptions
} from '@/api/lib/products/cartSuggestionOptions'
import { Progress } from '@/components/ui/progress'
import { formatNOK } from '@/lib/utils/formatters/formatNOK'
import type { ShopifyProduct } from 'types/product'
import type { Cart } from 'types/cart'
import { FreeShippingConfirmation } from './FreeShippingConfirmation'
import { UpsellItem } from './UpsellItem'

const BLOCKED_SUGGESTION_PRODUCT_IDS = new Set<string>()
const BLOCKED_SUGGESTION_HANDLES = new Set<string>()

function isSuggestionEligible(product: ShopifyProduct): boolean {
  if (
    BLOCKED_SUGGESTION_PRODUCT_IDS.has(product.id) ||
    BLOCKED_SUGGESTION_HANDLES.has(product.handle)
  ) {
    return false
  }

  if (!product.availableForSale) {
    return false
  }

  if (
    typeof product.totalInventory === 'number' &&
    product.totalInventory <= 0
  ) {
    return false
  }

  return (
    product.variants?.edges?.some(
      edge => edge.node.availableForSale
    ) ?? false
  )
}

export function SmartCartSuggestions({
  cart
}: {
  cart: Cart | null | undefined
}) {
  const { data: recommendedProducts = [] } = useQuery(
    recommendedProductsOptions
  )

  const { data: accessoryProducts = [] } = useQuery(
    accessoryProductsOptions
  )

  if (!cart || cart.totalQuantity === 0) {
    return null
  }

  const subtotal = parseFloat(cart.cost.subtotalAmount.amount)
  const cartLineProductIds = new Set(
    cart.lines.map(line => line.merchandise.product.id)
  )

  const eligibleAccessoryProducts = accessoryProducts.filter(
    isSuggestionEligible
  )
  const eligibleRecommendedProducts = recommendedProducts.filter(
    isSuggestionEligible
  )

  if (subtotal < FREE_SHIPPING_THRESHOLD) {
    const remainingAmount = FREE_SHIPPING_THRESHOLD - subtotal

    // Bolt Performance Optimization: Single-pass candidate collection with pre-parsed prices.
    // Avoids intermediate arrays from spreads, `new Map()` allocations, and repeated
    // `parseFloat()` parsing inside the sort comparator function (O(N log N) -> O(N) parses).
    interface Candidate {
      product: ShopifyProduct
      price: number
    }
    const candidates: Candidate[] = []
    const seenProductIds = new Set<string>()

    const addCandidates = (products: ShopifyProduct[]) => {
      for (let i = 0; i < products.length; i++) {
        const product = products[i]
        if (!product) continue
        if (
          !seenProductIds.has(product.id) &&
          !cartLineProductIds.has(product.id)
        ) {
          seenProductIds.add(product.id)
          candidates.push({
            product,
            price: parseFloat(product.priceRange.minVariantPrice.amount)
          })
        }
      }
    }

    addCandidates(eligibleAccessoryProducts)
    addCandidates(eligibleRecommendedProducts)

    candidates.sort((a, b) => {
      const aIsBridge = a.price >= remainingAmount
      const bIsBridge = b.price >= remainingAmount

      if (aIsBridge && !bIsBridge) return -1
      if (!aIsBridge && bIsBridge) return 1
      if (aIsBridge && bIsBridge) return a.price - b.price

      return b.price - a.price
    })

    if (candidates.length === 0) return null

    const topCandidate = candidates[0]?.product
    if (!topCandidate) return null

    const suggestions = [topCandidate]

    const showDiscountHint = eligibleAccessoryProducts.some(
      product => product.id === topCandidate.id
    )

    return (
      <div className='border-t border-border bg-background p-6'>
        <div className='text-center text-foreground'>
          <p>
            Du er kun{' '}
            <span className='font-google-sans font-bold text-foreground'>
              {formatNOK(remainingAmount)}
            </span>{' '}
            unna fri frakt!
          </p>
          <Progress
            value={(subtotal / FREE_SHIPPING_THRESHOLD) * 100}
            className='mt-2 h-2'
          />
        </div>
        <div className='mt-4 space-y-4'>
          {suggestions.map(product => (
            <UpsellItem
              key={product.id}
              product={product}
              showDiscountHint={showDiscountHint}
            />
          ))}
        </div>
      </div>
    )
  }

  const accessoriesToShow = eligibleAccessoryProducts.filter(
    product => !cartLineProductIds.has(product.id)
  )

  const suggestions =
    accessoriesToShow.length > 0 ?
      accessoriesToShow
    : eligibleRecommendedProducts
        .filter(product => !cartLineProductIds.has(product.id))
        .slice(0, 2)

  if (suggestions.length === 0) {
    return (
      <div className='border-t border-border bg-background p-6'>
        <FreeShippingConfirmation />
      </div>
    )
  }

  const showDiscountHint = accessoriesToShow.length > 0
  const title =
    accessoriesToShow.length > 0 ?
      'Fullfør din Utekos'
    : 'Andre livsnytere har også sett på'

  return (
    <div className='border-t border-border bg-background p-6'>
      <FreeShippingConfirmation />
      <div className='mt-6'>
        <h3 className='text-center font-utekos-text-medium text-sm text-foreground'>
          {title}
        </h3>
        <div className='mt-4 space-y-4'>
          {suggestions.map(product => (
            <UpsellItem
              key={product.id}
              product={product}
              showDiscountHint={showDiscountHint}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
