'use client'

import dynamic from 'next/dynamic'
import { LandingPurchaseFallback } from './LandingPurchaseFallback'
import { loadPurchaseClientLanding } from './loadPurchaseClientLanding'

export const DeferredPurchaseClientLanding = dynamic(
  () =>
    loadPurchaseClientLanding().then(module => ({
      default: module.PurchaseClientLanding
    })),
  {
    loading: () => <LandingPurchaseFallback />,
    ssr: true
  }
)
