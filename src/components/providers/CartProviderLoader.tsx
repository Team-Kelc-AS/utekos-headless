import Providers from '@/components/providers/Providers'
import { getCartIdFromCookie } from '@/lib/actions/cart/getCartIdFromCookie'

export async function CartProviderLoader({
  children
}: {
  children: React.ReactNode
}) {
  const cartId = await getCartIdFromCookie()
  return <Providers cartId={cartId}>{children}</Providers>
}
