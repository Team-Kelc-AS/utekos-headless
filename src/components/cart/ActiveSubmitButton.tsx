import { ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ActiveSubmitButtonProps {
  isPending: boolean
  isDisabled: boolean
}

export function ActiveSubmitButton({
  isPending,
  isDisabled
}: ActiveSubmitButtonProps) {
  return (
    <Button
      type='submit'
      data-track='ModalAddToCart'
      disabled={isPending || isDisabled}
      aria-label='Legg i handlekurv'
      className='h-14 w-full min-w-0 gap-2 rounded-full bg-primary px-5 font-utekos-text-medium text-base text-primary-foreground shadow-[0_20px_42px_-28px_color-mix(in_oklch,var(--primary)_65%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed sm:gap-3'
    >
      <ShoppingBag className='size-5 shrink-0' aria-hidden='true' />
      <span className='truncate'>
        {isPending ? 'Legger til...' : 'Legg i handlekurv'}
      </span>
    </Button>
  )
}
