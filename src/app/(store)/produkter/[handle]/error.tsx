'use client'

import { useEffect, useTransition } from 'react'
import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError'
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
    reportClientCaughtError(error, 'product_page_error_boundary')
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
