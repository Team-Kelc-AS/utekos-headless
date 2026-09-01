'use client'

import NextError from 'next/error'
import { useEffect } from 'react'
import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError'

export default function GlobalError({
  error
}: {
  error: Error & { digest?: string | undefined }
}) {
  useEffect(() => {
    reportClientCaughtError(error, 'global_error_boundary')
  }, [error])

  return (
    <html lang="nb">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
