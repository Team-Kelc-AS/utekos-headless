'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError'
import {
  COOKIEBOT_CONSENT_EVENTS,
  hasCookiebotMarketingConsent,
  type CookiebotApi
} from '@/lib/consent/cookiebotConsent'
import { getConsentSnapshot } from '@/lib/analytics/pageViewClientContext'
import { ensureMetaClientParameterContext } from '@/lib/analytics/metaClientParameterBuilder'

type CookiebotWindow = Window & { Cookiebot?: CookiebotApi }

export function MetaParameterBuilderInitializer() {
  const pathname = usePathname()
  const search = useSearchParams().toString()

  useEffect(() => {
    const initialize = () => {
      const cookiebot = (window as CookiebotWindow).Cookiebot
      if (!hasCookiebotMarketingConsent(cookiebot)) return

      void ensureMetaClientParameterContext({
        consent: getConsentSnapshot(cookiebot?.consent),
        pageUrl: window.location.href
      }).catch(error => {
        reportClientCaughtError(
          error,
          'meta.client_parameter_builder'
        )
      })
    }

    initialize()
    for (const eventName of COOKIEBOT_CONSENT_EVENTS) {
      window.addEventListener(eventName, initialize)
    }

    return () => {
      for (const eventName of COOKIEBOT_CONSENT_EVENTS) {
        window.removeEventListener(eventName, initialize)
      }
    }
  }, [pathname, search])

  return null
}
