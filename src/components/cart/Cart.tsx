// Path: src/components/cart/Cart.tsx
'use client'

import dynamic from 'next/dynamic'
import {
  useContext,
  useSyncExternalStore,
  type ReactNode
} from 'react'
import { CartTrigger } from '@/components/cart/CartTrigger'
import { useCartOpen } from '@/hooks/useCartOpen'
import { CartBootstrapContext } from '@/lib/context/CartBootstrapContext'

const CartDrawer = dynamic(
  () =>
    import('./CartDrawer/CartDrawer').then(
      module => module.CartDrawer
    ),
  { ssr: false }
)

const subscribeToClientSnapshot = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function Cart({
  className,
  icon,
  showLabel = false
}: {
  className?: string
  icon?: ReactNode
  showLabel?: boolean
}) {
  const isMounted = useSyncExternalStore(
    subscribeToClientSnapshot,
    getClientSnapshot,
    getServerSnapshot
  )
  const cartBootstrapStatus = useContext(CartBootstrapContext)
  const open = useCartOpen()

  if (!isMounted || cartBootstrapStatus === 'pending') {
    return (
      <div
        aria-hidden
        className={className ?? 'size-11 shrink-0'}
      >
        {icon}
      </div>
    )
  }

  return (
    <>
      <CartTrigger
        className={className}
        showLabel={showLabel}
        icon={icon}
      />
      {open ?
        <CartDrawer />
      : null}
    </>
  )
}
