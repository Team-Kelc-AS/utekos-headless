import Providers from '@/components/providers/Providers'
import { QueryClient, dehydrate } from '@tanstack/react-query'

export function CartProviderLoader({
  children
}: {
  children: React.ReactNode
}) {
  const queryClient = new QueryClient()

  return (
    <Providers
      dehydratedState={dehydrate(queryClient)}
      cartId={null}
    >
      {children}
    </Providers>
  )
}
