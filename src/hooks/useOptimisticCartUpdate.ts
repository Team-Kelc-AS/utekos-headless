import { useQueryClient } from '@tanstack/react-query'
import { createOptimisticLineItem } from '@/lib/helpers/cart/createOptimisticLineItem'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'
import type { Cart } from 'types/cart'

export interface OptimisticItemInput {
  product: ProductCartModel
  variant: ProductPurchaseVariant
  quantity: number
  customPrice?: number
}

interface OptimisticUpdateParams {
  cartId: string
  items: OptimisticItemInput[]
}

export function useOptimisticCartUpdate() {
  const queryClient = useQueryClient()

  const updateCartCache = async ({ cartId, items }: OptimisticUpdateParams) => {
    // Avbryt pågående kall så vi har fri bane
    await queryClient.cancelQueries({ queryKey: ['cart', cartId] })

    queryClient.setQueryData<Cart>(['cart', cartId], oldCart => {
      // FIX: Opprett en midlertidig cart hvis den ikke finnes.
      // Dette sikrer at skuffen viser innhold umiddelbart selv for nye brukere.
      const baseCart: Cart = oldCart || {
        id: cartId,
        checkoutUrl: '',
        totalQuantity: 0,
        cost: {
          totalAmount: { amount: '0.0', currencyCode: 'NOK' },
          subtotalAmount: { amount: '0.0', currencyCode: 'NOK' }
        },
        lines: []
      }

      const newLines = [...baseCart.lines]
      let addedTotalQuantity = 0

      for (const item of items) {
        const newLine = createOptimisticLineItem(
          item.product,
          item.variant,
          item.quantity,
          item.customPrice
        )

        const existingLineIndex = newLines.findIndex(
          line => line.merchandise.id === newLine.merchandise.id
        )

        if (existingLineIndex >= 0) {
          const existingLine = newLines[existingLineIndex]
          if (!existingLine) continue

          const newQuantity = existingLine.quantity + item.quantity

          const unitPriceToAdd =
            item.customPrice !== undefined ?
              item.customPrice
            : parseFloat(item.variant.price.amount)

          const currentTotalAmount = parseFloat(
            existingLine.cost.totalAmount.amount
          )
          const addedCost = unitPriceToAdd * item.quantity
          const newTotalAmount = (currentTotalAmount + addedCost).toString()

          newLines[existingLineIndex] = {
            ...existingLine,
            quantity: newQuantity,
            cost: {
              ...existingLine.cost,
              totalAmount: {
                ...existingLine.cost.totalAmount,
                amount: newTotalAmount
              }
            }
          }
        } else {
          newLines.push(newLine)
        }

        addedTotalQuantity += item.quantity
      }

      return {
        ...baseCart,
        lines: newLines,
        totalQuantity: baseCart.totalQuantity + addedTotalQuantity
      }
    })
  }

  return { updateCartCache }
}
