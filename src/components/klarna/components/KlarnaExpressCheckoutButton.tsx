'use client'

import { useEffect, useId, useRef } from 'react'

import { cn } from '@/lib/utils/className'
import { useInView } from '@/hooks/useInView'
import { completeKlarnaExpressCheckout } from '@/components/klarna/utils/completeKlarnaExpressCheckout'
import { classifyKlarnaAuthorizationResult } from '@/components/klarna/utils/classifyKlarnaAuthorizationResult'
import { loadKlarnaExpressCheckoutSdk } from '@/components/klarna/utils/loadKlarnaExpressCheckoutSdk'
import { loadKlarnaPublicConfig } from '@/components/klarna/utils/loadKlarnaPublicConfig'
import {
  klarnaCollectedShippingAddressSchema,
  type KlarnaExpressOrderPayload
} from '@/components/klarna/schemas/klarnaExpressOrderSchema'
import styles from './KlarnaExpressCheckoutButton.module.css'

import type {
  KlarnaExpressCheckoutAuthorizationResult,
  KlarnaExpressCheckoutAuthorize
} from '../types'

export type KlarnaExpressPreparedAuthorize = {
  orderPayload: KlarnaExpressOrderPayload
  shopifyCartId: string
}

export type KlarnaExpressCheckoutTheme =
  | 'default'
  | 'light'
  | 'outlined'

type KlarnaExpressCheckoutButtonProps = {
  orderPayload: KlarnaExpressOrderPayload
  shopifyCartId?: string
  disabled?: boolean
  theme?: KlarnaExpressCheckoutTheme
  className?: string
  buttonContainerClassName?: string
  onError?: (message: string) => void
  onAuthorizing?: () => void
  onPrepareAuthorize?: () => Promise<KlarnaExpressPreparedAuthorize | null>
}

function parseCollectedShippingAddress(
  result: KlarnaExpressCheckoutAuthorizationResult
) {
  const candidate =
    (
      typeof result.collected_shipping_address === 'object' &&
      result.collected_shipping_address !== null
    ) ?
      result.collected_shipping_address
    : result

  return klarnaCollectedShippingAddressSchema.safeParse(
    candidate
  )
}

export function KlarnaExpressCheckoutButton({
  orderPayload,
  shopifyCartId,
  disabled = false,
  theme = 'default',
  className,
  buttonContainerClassName,
  onError,
  onAuthorizing,
  onPrepareAuthorize
}: KlarnaExpressCheckoutButtonProps) {
  const containerSuffix = useId().replace(/:/g, '')
  const containerId = `klarna-express-checkout-${containerSuffix}`
  const [setContainerRef, isNearViewport] = useInView<HTMLDivElement>({
    threshold: 0,
    triggerOnce: true,
    // Prefetch shortly before the CTA enters view; avoids eager Kasada/Klarna
    // work on cold homepage loads while keeping cart/drawer mounts snappy.
    rootMargin: '240px 0px'
  })
  const payloadRef = useRef(orderPayload)
  const cartIdRef = useRef(shopifyCartId)
  const onErrorRef = useRef(onError)
  const onAuthorizingRef = useRef(onAuthorizing)
  const onPrepareAuthorizeRef = useRef(onPrepareAuthorize)
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    payloadRef.current = orderPayload
    cartIdRef.current = shopifyCartId
    onErrorRef.current = onError
    onAuthorizingRef.current = onAuthorizing
    onPrepareAuthorizeRef.current = onPrepareAuthorize
  }, [
    onAuthorizing,
    onError,
    onPrepareAuthorize,
    orderPayload,
    shopifyCartId
  ])

  useEffect(() => {
    if (disabled || !isNearViewport) {
      return
    }

    let isActive = true

    void loadKlarnaPublicConfig()
      .then(async config => {
        await loadKlarnaExpressCheckoutSdk()

        if (
          !isActive ||
          hasInitializedRef.current ||
          !window.Klarna?.Payments?.Buttons
        ) {
          return
        }

        hasInitializedRef.current = true

        window.Klarna.Payments.Buttons.init({
          client_id: config.client_id
        }).load(
          {
            container: `#${containerId}`,
            theme,
            shape: 'pill',
            locale: 'nb-NO',
            on_click: (
              authorize: KlarnaExpressCheckoutAuthorize
            ) => {
              void (async () => {
                onAuthorizingRef.current?.()

                let authorizePayload = payloadRef.current
                let authorizeCartId = cartIdRef.current

                if (onPrepareAuthorizeRef.current) {
                  try {
                    const prepared =
                      await onPrepareAuthorizeRef.current()

                    if (!prepared) {
                      onErrorRef.current?.(
                        'Klarna-kassen kunne ikke forberedes'
                      )
                      return
                    }

                    authorizePayload = prepared.orderPayload
                    authorizeCartId = prepared.shopifyCartId
                    payloadRef.current = authorizePayload
                    cartIdRef.current = authorizeCartId
                  } catch (error) {
                    onErrorRef.current?.(
                      error instanceof Error ?
                        error.message
                      : 'Klarna-kassen kunne ikke forberedes'
                    )
                    return
                  }
                }

                authorize(
                  {
                    auto_finalize: true,
                    collect_shipping_address: true
                  },
                  authorizePayload,
                  async (
                    result: KlarnaExpressCheckoutAuthorizationResult
                  ) => {
                    const authorizationOutcome =
                      classifyKlarnaAuthorizationResult(result)

                    if (authorizationOutcome !== 'approved') {
                      if (
                        authorizationOutcome === 'unavailable'
                      ) {
                        onErrorRef.current?.(
                          'Klarna er ikke tilgjengelig for dette kjøpet akkurat nå'
                        )
                      }
                      return
                    }

                    const authorizationToken =
                      result.authorization_token

                    if (!authorizationToken) {
                      return
                    }

                    const parsedAddress =
                      parseCollectedShippingAddress(result)

                    if (!parsedAddress.success) {
                      onErrorRef.current?.(
                        'Klarna did not return a valid shipping address'
                      )
                      return
                    }

                    if (!authorizeCartId) {
                      onErrorRef.current?.(
                        'Klarna-kassen mangler handlekurvreferanse'
                      )
                      return
                    }

                    try {
                      const completion =
                        await completeKlarnaExpressCheckout({
                          authorizationToken,
                          orderPayload: authorizePayload,
                          collectedShippingAddress:
                            parsedAddress.data,
                          shopifyCartId: authorizeCartId
                        })

                      window.location.assign(
                        completion.redirect_url
                      )
                    } catch (error) {
                      const message =
                        error instanceof Error ?
                          error.message
                        : 'Klarna express checkout failed'

                      onErrorRef.current?.(message)
                    }
                  }
                )
              })()
            }
          },
          loadResult => {
            if (loadResult.show_form === false) {
              onErrorRef.current?.(
                'Klarna express button is not available for this order'
              )
            }
          }
        )
      })
      .catch(error => {
        if (!isActive) {
          return
        }

        onErrorRef.current?.(
          error instanceof Error ?
            error.message
          : 'Klarna Payments SDK could not be loaded'
        )
      })

    return () => {
      isActive = false
    }
  }, [containerId, disabled, isNearViewport, theme])

  return (
    <div
      ref={setContainerRef}
      className={cn(
        'flex h-full w-full items-stretch justify-center',
        className
      )}
      aria-busy={disabled}
    >
      <div
        id={containerId}
        className={cn(
          styles.host,
          'h-12 min-h-12 ring-1 ring-card-foreground/50 ring-inset md:h-12 md:min-h-12',
          buttonContainerClassName
        )}
      />
    </div>
  )
}
