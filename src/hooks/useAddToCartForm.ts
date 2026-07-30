import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { createAddToCartFormConfig } from '@/lib/helpers/cart/createAddToCartFormConfig'
import type { AddToCartFormValues } from 'types/cart'
import type { ProductPurchaseVariant } from 'types/product/ProductPurchaseModel'

export function useAddToCartForm(
  selectedVariant: ProductPurchaseVariant | null
) {
  const form = useForm<AddToCartFormValues>(
    createAddToCartFormConfig(selectedVariant)
  )

  useEffect(() => {
    form.setValue('variantId', selectedVariant?.id ?? '')
  }, [selectedVariant?.id, form])

  return form
}
