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
  isAddToCartPending,
  isCheckoutPending,
  isAvailable,
  checkoutPresentation = 'balanced',
  showAddToCartAction = true,
  surface = 'default'
}: AddToCartViewProps) {
  const quantity = form.watch('quantity')
  const inheritsSurface = surface === 'inherit'

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          'flex flex-col gap-4 py-6',
          inheritsSurface ? 'bg-transparent' : 'bg-background'
        )}
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
          <QuantitySelector surface={surface} />
        </div>
        <ModalSubmitButton
          product={product}
          selectedVariant={selectedVariant}
          quantity={quantity}
          isAddToCartPending={isAddToCartPending}
          isCheckoutPending={isCheckoutPending}
          isDisabled={!isAvailable || isPending}
          availableForSale={isAvailable}
          onCheckout={form.handleSubmit(onCheckout)}
          checkoutPresentation={checkoutPresentation}
          showAddToCartAction={showAddToCartAction}
        />
      </form>
    </Form>
  )
}
