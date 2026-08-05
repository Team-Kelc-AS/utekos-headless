'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

import { getQueryClient } from '@/api/lib/getQueryClient'
import { CartMutationProvider } from '@/clients/CartMutationProvider'
import { CartIdProvider } from '@/components/providers/CartIdProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { serverActions } from '@/constants/serverActions'
import { adoptAuthoritativeCartIdentity } from '@/lib/cart/adoptAuthoritativeCartIdentity'
import { migrateLegacyCartSessionStorageKeys } from '@/lib/cart/migrateLegacyCartSessionStorageKeys'
import { resolveBootstrappedCartId } from '@/lib/cart/resolveBootstrappedCartId'
import { getCartIdFromCookie } from '@/lib/actions/cart/getCartIdFromCookie'
import {
  CartBootstrapContext,
  type CartBootstrapStatus
} from '@/lib/context/CartBootstrapContext'
import { CartIdentityActionsContext } from '@/lib/context/CartIdentityActionsContext'
import type { Cart as CartModel } from 'types/cart'

const CART_BOOTSTRAP_TIMEOUT_MS = 3000

const ReactQueryDevtools =
  process.env.NODE_ENV === 'development' ?
    dynamic(
      () =>
        import('@tanstack/react-query-devtools').then(
          module => module.ReactQueryDevtools
        ),
      { ssr: false }
    )
  : null

interface ProvidersProps {
  children: React.ReactNode
  cartId: string | null
}

export default function Providers({
  children,
  cartId: initialCartId
}: ProvidersProps) {
  const queryClient = getQueryClient()

  const [cartId, setCartId] = useState<string | null>(
    initialCartId
  )

  const [cartBootstrapStatus, setCartBootstrapStatus] =
    useState<CartBootstrapStatus>('pending')

  const adoptCartIdentity = (
    authoritativeCartId: string | null,
    cart: CartModel | null
  ) => {
    adoptAuthoritativeCartIdentity(authoritativeCartId, cart, {
      setCartId,
      setCartCache: (nextCartId, nextCart) => {
        queryClient.setQueryData(['cart', nextCartId], nextCart)
      },
      removeOtherCartCaches: nextCartId => {
        queryClient.removeQueries({
          predicate: query =>
            query.queryKey[0] === 'cart' &&
            query.queryKey[1] !== nextCartId
        })
      }
    })
  }

  useEffect(() => {
    let isActive = true

    try {
      migrateLegacyCartSessionStorageKeys(window.sessionStorage)
    } catch {
      // Storage can be unavailable in privacy-restricted browsers.
    }

    const timeoutId = window.setTimeout(() => {
      if (isActive) {
        setCartBootstrapStatus('ready')
      }
    }, CART_BOOTSTRAP_TIMEOUT_MS)

    void getCartIdFromCookie()
      .then(persistedCartId => {
        if (!isActive || !persistedCartId) {
          return
        }

        setCartId(currentCartId =>
          resolveBootstrappedCartId(
            currentCartId,
            persistedCartId
          )
        )
      })
      .catch(error => {
        console.warn(
          '[cart-cookie-bootstrap] Cookie read failed',
          {
            errorName:
              error instanceof Error ?
                error.name
              : 'UnknownError'
          }
        )
      })
      .finally(() => {
        window.clearTimeout(timeoutId)

        if (isActive) {
          setCartBootstrapStatus('ready')
        }
      })

    return () => {
      isActive = false
      window.clearTimeout(timeoutId)
    }
  }, [])

  return (
    <CartBootstrapContext.Provider value={cartBootstrapStatus}>
      <ThemeProvider
        attribute='class'
        defaultTheme='dark'
        forcedTheme='dark'
        disableTransitionOnChange
        enableColorScheme
      >
        <QueryClientProvider client={queryClient}>
          <CartIdProvider value={cartId}>
            <CartIdentityActionsContext.Provider
              value={{ adoptCartIdentity }}
            >
              <CartMutationProvider
                actions={serverActions}
                adoptCartIdentity={adoptCartIdentity}
              >
                {children}
              </CartMutationProvider>
            </CartIdentityActionsContext.Provider>
          </CartIdProvider>

          {ReactQueryDevtools ?
            <ReactQueryDevtools initialIsOpen={false} />
          : null}
        </QueryClientProvider>
      </ThemeProvider>
    </CartBootstrapContext.Provider>
  )
}
