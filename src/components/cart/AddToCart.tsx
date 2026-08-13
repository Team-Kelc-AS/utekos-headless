'use client'

import { useAddToCartAction } from '@/hooks/useAddToCartAction'
import { useAddToCartForm } from '@/hooks/useAddToCartForm'
import { useCartErrorMonitoring } from '@/hooks/useCartErrorMonitoring'
import { AddToCartView } from './AddToCartView'
import type {
  AddToCartFormValues,
  AddToCartProps
} from 'types/cart'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

interface ExtendedAddToCartProps extends AddToCartProps {
  additionalProductData?: {
    product: ProductCartModel
    variant: ProductPurchaseVariant
  }
}

export function AddToCart({
  product,
  selectedVariant,
  additionalLine,
  additionalProductData,
  checkoutPresentation = 'balanced',
  isSelectionPending = false,
  showAddToCartAction = true,
  showQuickCheckoutAction = true,
  showQuantitySelector = true,
  surface = 'default'
}: ExtendedAddToCartProps) {
  const {
    performAddToCart,
    performGoToCheckout,
    isPending,
    isAddToCartPending,
    isCheckoutPending
  } = useAddToCartAction({
    product,
    selectedVariant,
    additionalLine,
    ...(additionalProductData ? { additionalProductData } : {})
  })

  const form = useAddToCartForm(selectedVariant)

  useCartErrorMonitoring()

  const onSubmit = (values: AddToCartFormValues) => {
    void performAddToCart(values.quantity)
  }

  const onCheckout = (values: AddToCartFormValues) => {
    void performGoToCheckout(values.quantity)
  }

  const isAvailable = selectedVariant?.availableForSale ?? false

  return (
    <AddToCartView
      form={form}
      product={product}
      selectedVariant={selectedVariant}
      onSubmit={onSubmit}
      onCheckout={onCheckout}
      isPending={isPending || isSelectionPending}
      isAddToCartPending={isAddToCartPending}
      isCheckoutPending={isCheckoutPending}
      isAvailable={isAvailable}
      checkoutPresentation={checkoutPresentation}
      showAddToCartAction={showAddToCartAction}
      showQuickCheckoutAction={showQuickCheckoutAction}
      showQuantitySelector={showQuantitySelector}
      surface={surface}
    />
  )
}
