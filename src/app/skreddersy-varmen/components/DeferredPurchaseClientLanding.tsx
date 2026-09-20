'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { LandingPurchaseFallback } from './LandingPurchaseFallback'
import type { ProductModel } from '@/lib/products/commerce'
import type { ProductPresentation } from '@/lib/products/presentation/getProductPresentation'

const Purchase = dynamic(
  () => import('./LandingPurchaseRuntime'),
  { loading: LandingPurchaseFallback }
)

export function DeferredPurchaseClientLanding(props: {
  commerce: ProductModel
  initialVariantId: string
  presentation: ProductPresentation
}) {
  const [cartRequest, setCartRequest] = useState(0)

  useEffect(() => {
    const openCart = () => {
      setCartRequest(value => value + 1)
    }
    window.addEventListener('utekos:landing:cart', openCart)

    return () => {
      window.removeEventListener('utekos:landing:cart', openCart)
    }
  }, [])

  return <Purchase {...props} cartRequest={cartRequest} />
}
