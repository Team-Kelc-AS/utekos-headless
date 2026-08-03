import { Form } from '@/components/ui/form'
import { cn } from '@/lib/utils/className'
import { ModalSubmitButton } from './ModalSubmitButton'
import { QuantitySelector } from './QuantitySelector'
import type { AddToCartViewProps } from 'types/cart'

export function AddToCartView({
  form,
  product,
  selectedVariant,
  onSubmit,
  onCheckout,
  isPending,
  isCheckoutPending,
  isAvailable,
  checkoutPresentation = 'balanced'
}: AddToCartViewProps) {
  const quantity = form.watch('quantity')

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex flex-col gap-4 bg-background py-6'
      >
        <div className='space-y-2'>
          <label
            className={cn(
              'block font-utekos-text-medium text-sm tracking-wide text-foreground',
              checkoutPresentation === 'balanced' && 'uppercase'
            )}
          >
            Antall
          </label>
          <QuantitySelector />
        </div>
        <ModalSubmitButton
          product={product}
          selectedVariant={selectedVariant}
          quantity={quantity}
          isCheckoutPending={isCheckoutPending}
          isDisabled={!isAvailable || isPending}
          availableForSale={isAvailable}
          onCheckout={form.handleSubmit(onCheckout)}
          checkoutPresentation={checkoutPresentation}
        />
      </form>
    </Form>
  )
}
