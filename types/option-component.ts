import type { ProductPurchaseModel } from 'types/product/ProductPurchaseModel'
import type { ProductPageViewProps } from 'types/product/PageProps'
export type RenderOptionComponentProps = Pick<
  ProductPageViewProps,
  | 'allVariants'
  | 'selectedVariant'
  | 'onOptionChange'
  | 'colorHexMap'
  | 'productOptions'
  | 'isVariantNavigationPending'
  | 'hasVariantSelectionError'
> & {
  option: ProductPurchaseModel['options'][number]
  productHandle: string
}
