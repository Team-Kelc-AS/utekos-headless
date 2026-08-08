import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'
import type { UseFormReturn } from 'react-hook-form'
import type { SizeOptionKey } from '@/app/inspirasjon/isbading/sizeSelectorData'
import type { LucideIcon } from 'lucide-react'
import type { AddToCartSchema } from '@/db/zod/schemas/AddToCartSchema'
import { z } from '@/db/zod/zodClient'
export type AddToCartFormValues = z.infer<typeof AddToCartSchema>

export type AddToCartButtonProps = {
  isPending: boolean
  isDisabled: boolean
}

export type CheckoutPresentation =
  | 'balanced'
  | 'standard-primary'

export type AddToCartSurface = 'default' | 'inherit'

export type PrepareAddToCartInput = {
  product: ProductCartModel
  selectedVariant: ProductPurchaseVariant
  quantity: number
  additionalLine?:
    | { variantId: string; quantity: number }
    | undefined
}

export type UseAddToCartActionProps = {
  product: ProductCartModel
  selectedVariant: ProductPurchaseVariant | null
  additionalLine?:
    | { variantId: string; quantity: number }
    | undefined
}

export type AddToCartProps = {
  product: ProductCartModel
  selectedVariant: ProductPurchaseVariant | null
  additionalLine?:
    | { variantId: string; quantity: number }
    | undefined
  checkoutPresentation?: CheckoutPresentation
  isSelectionPending?: boolean
  showAddToCartAction?: boolean
  surface?: AddToCartSurface
}

export type AddToCartViewProps = {
  form: UseFormReturn<AddToCartFormValues>
  product: ProductCartModel
  selectedVariant: ProductPurchaseVariant | null
  onSubmit: (values: AddToCartFormValues) => void
  onCheckout: (values: AddToCartFormValues) => void
  isPending: boolean
  isAddToCartPending: boolean
  isCheckoutPending: boolean
  isAvailable: boolean
  checkoutPresentation?: CheckoutPresentation
  showAddToCartAction?: boolean
  surface?: AddToCartSurface
}

export type CheckoutPanelProps = {
  mainProduct: ProductOffer
  upsellProduct: ProductOffer
  isUpsellSelected: boolean
  selectedSize: 'S' | 'M' | 'L'
  productImageSrc: string
}

export type ProductOffer = {
  id: string
  name: string
  price: number
  originalPrice?: number
  features: string[]
}

export type OfferProductProps = { product: ProductOffer }

export type OfferSectionProps = {
  productImageSrc: string
  selectedSize: SizeOptionKey
}

export type SizeInfoPanelProps = { profile: SizeProfile }

export type SizeProfile = {
  id: SizeOptionKey
  fullName: string
  label: string
  tagline: string
  heightRange: string
  idealFor: string[]
  icon: LucideIcon
  imageSrc?: string
  visualScale: number
  benefits: { title: string; desc: string }[]
}

export type OfferGalleryProps = {
  name: string
  mainImageSrc: string
}
