'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError'
import { getConsentSnapshot } from '@/lib/analytics/pageViewClientContext'
import { ensureMetaClientParameterContext } from '@/lib/analytics/metaClientParameterBuilder'

export function MetaParameterBuilderInitializer() {
  const pathname = usePathname()
  const search = useSearchParams().toString()

  useEffect(() => {
    void ensureMetaClientParameterContext({
        consent: getConsentSnapshot(),
        pageUrl: window.location.href
      }).catch(error => {
        reportClientCaughtError(
          error,
          'meta.client_parameter_builder'
        )
      })
  }, [pathname, search])

  return null
}
