'use client'
import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { getQueryClient } from '@/api/lib/getQueryClient'
import { CartMutationProvider } from '@/clients/CartMutationProvider'
import { serverActions } from '@/constants/serverActions'
import { CartIdProvider } from '@/components/providers/CartIdProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { CartBootstrapContext } from '@/lib/context/CartBootstrapContext'
import { migrateLegacyCartSessionStorageKeys } from '@/lib/cart/migrateLegacyCartSessionStorageKeys'
import { CartIdentityActionsContext } from '@/lib/context/CartIdentityActionsContext'
import { adoptAuthoritativeCartIdentity } from '@/lib/cart/adoptAuthoritativeCartIdentity'
import type { Cart as CartModel } from 'types/cart'

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
    try {
      migrateLegacyCartSessionStorageKeys(window.sessionStorage)
    } catch {
      // Storage can be unavailable in privacy-restricted browsers.
    }
  }, [])

  return (
    <CartBootstrapContext.Provider value='ready'>
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
