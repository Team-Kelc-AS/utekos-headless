'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import {
  COOKIEBOT_CONSENT_EVENTS,
  hasCookiebotMarketingConsent,
  type CookiebotApi
} from '@/lib/consent/cookiebotConsent'
import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError'
import {
  discardRejectedMetaBrowserEvents,
  initializeSignalsGatewayPixel,
  prepareSignalsGatewayPixelQueue,
  type MetaBrowserWindow
} from '@/lib/analytics/signalsGatewayPixelRuntime'
import type { SignalsGatewayPixelConfig } from '@/lib/analytics/signalsGatewayPixelConfig'

type CookiebotWindow = MetaBrowserWindow & {
  Cookiebot?: CookiebotApi
}

type ConsentState = 'denied' | 'granted' | 'pending'
type GatewayLoadState = 'failed' | 'idle' | 'loading' | 'ready'

type MetaBrowserTransportLoaderProps = {
  signalsGateway: SignalsGatewayPixelConfig
}

export function MetaBrowserTransportLoader({
  signalsGateway
}: MetaBrowserTransportLoaderProps) {
  const [consentState, setConsentState] =
    useState<ConsentState>('pending')
  const [gatewayLoadState, setGatewayLoadState] =
    useState<GatewayLoadState>(
      signalsGateway.enabled ? 'idle' : 'ready'
    )

  useEffect(() => {
    const browserWindow = window as CookiebotWindow

    const synchronizeConsent = () => {
      const cookiebot = browserWindow.Cookiebot

      if (hasCookiebotMarketingConsent(cookiebot)) {
        if (signalsGateway.enabled) {
          prepareSignalsGatewayPixelQueue(browserWindow)
          setGatewayLoadState(currentState =>
            currentState === 'idle' ? 'loading' : currentState
          )
        }

        setConsentState('granted')
        return
      }

      if (cookiebot?.hasResponse === true) {
        discardRejectedMetaBrowserEvents(browserWindow)
        setConsentState('denied')
      }
    }

    synchronizeConsent()
    for (const eventName of COOKIEBOT_CONSENT_EVENTS) {
      window.addEventListener(eventName, synchronizeConsent)
    }

    return () => {
      for (const eventName of COOKIEBOT_CONSENT_EVENTS) {
        window.removeEventListener(eventName, synchronizeConsent)
      }
    }
  }, [signalsGateway.enabled])

  useEffect(() => {
    if (
      consentState !== 'granted' ||
      gatewayLoadState !== 'loading'
    ) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      reportClientCaughtError(
        new Error('Signals Gateway Pixel SDK startup timed out'),
        'meta.signals_gateway_pixel'
      )
      setGatewayLoadState('failed')
    }, signalsGateway.startupTimeoutMs)

    return () => window.clearTimeout(timeoutId)
  }, [
    consentState,
    gatewayLoadState,
    signalsGateway.startupTimeoutMs
  ])

  if (consentState !== 'granted') return null

  const shouldLoadMetaPixel =
    gatewayLoadState === 'failed' ||
    gatewayLoadState === 'ready'

  return (
    <>
      {signalsGateway.enabled ?
        <Script
          id='signals-gateway-pixel-sdk'
          src={`${signalsGateway.host}sdk/${signalsGateway.pixelId}/events.js`}
          strategy='afterInteractive'
          onLoad={() => {
            try {
              initializeSignalsGatewayPixel(
                window as MetaBrowserWindow,
                signalsGateway
              )
              setGatewayLoadState('ready')
            } catch (error) {
              reportClientCaughtError(
                error,
                'meta.signals_gateway_pixel'
              )
              setGatewayLoadState('failed')
            }
          }}
          onError={(error: Error) => {
            reportClientCaughtError(
              error,
              'meta.signals_gateway_pixel'
            )
            setGatewayLoadState('failed')
          }}
        />
      : null}

      {shouldLoadMetaPixel ?
        <Script
          id='meta-pixel-canonical-browser'
          src='/analytics/meta-pixel-canonical-v1.js'
          strategy='afterInteractive'
        />
      : null}
    </>
  )
}
