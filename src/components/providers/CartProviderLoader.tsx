import Providers from '@/components/providers/Providers'

export function CartProviderLoader({
  children
}: {
  children: React.ReactNode
}) {
  return <Providers cartId={null}>{children}</Providers>
}
