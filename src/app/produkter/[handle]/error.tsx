'use client'

import { captureException } from '@sentry/nextjs'
import { useEffect, useTransition } from 'react'
import { ProductPageErrorState } from './components/ProductPageErrorState'

export default function ProductPageError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [isRetrying, startRetry] = useTransition()

  useEffect(() => {
    captureException(error, {
      tags: { surface: 'product-page-error-boundary' }
    })
  }, [error])

  return (
    <ProductPageErrorState
      error={
        new Error(
          'Produktdata er midlertidig utilgjengelig. Prøv igjen om et øyeblikk.'
        )
      }
      isRetrying={isRetrying}
      onRetry={() => startRetry(reset)}
    />
  )
}
