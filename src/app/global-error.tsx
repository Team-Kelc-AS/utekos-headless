'use client'

import NextError from 'next/error'
import { useEffect } from 'react'

export default function GlobalError({
  error
}: {
  error: Error & { digest?: string | undefined }
}) {
  useEffect(() => {
    void import(
      '@/lib/observability/client/reportClientCaughtError'
    ).then(({ reportClientCaughtError }) => {
      reportClientCaughtError(error, 'global_error_boundary')
    })
  }, [error])

  return (
    <html lang="nb" suppressHydrationWarning>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
