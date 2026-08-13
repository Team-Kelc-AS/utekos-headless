import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
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
    <BrandBadge
      asChild
      backgroundColor='var(--coral-green)'
      textColor='var(--jungle)'
      className='border-jungle/20 ring-jungle/10 focus-visible:ring-jungle/45 dark:focus-visible:ring-offset-dark-background h-14 w-full min-w-0 gap-2 border px-3 py-4 font-utekos-text-medium text-sm shadow-[0_20px_42px_-28px_color-mix(in_oklch,var(--jungle)_65%,transparent)] ring-1 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-95 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:pointer-events-none disabled:opacity-55 sm:gap-3 sm:px-5 sm:text-base'
    >
      <Button
        type='submit'
        data-track='ModalAddToCart'
        disabled={isPending || isDisabled}
        aria-label='Legg i handlekurv'
        className='text-jungle cursor-pointer disabled:cursor-not-allowed'
      >
        <ShoppingBag
          className='size-5 shrink-0 place-self-start text-left'
          aria-hidden='true'
        />
        <span className='truncate'>
          {isPending ? 'Legger til...' : 'Legg i handlekurv'}
        </span>
      </Button>
    </BrandBadge>
  )
}
