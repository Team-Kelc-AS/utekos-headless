import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/className'
import { CreditCard } from 'lucide-react'

interface QuickCheckoutButtonProps {
  isPending: boolean
  isDisabled: boolean
  onClick: () => void
  className?: string
}

export function QuickCheckoutButton({
  isPending,
  isDisabled,
  onClick,
  className
}: QuickCheckoutButtonProps) {
  return (
    <Button
      type='button'
      variant='checkout'
      data-track='ModalGoToCheckout'
      disabled={isPending || isDisabled}
      aria-label='Gå til kassen'
      onClick={onClick}
      className={cn(
        'dark:focus-visible:ring-offset-dark-background h-14 w-full min-w-0 cursor-pointer gap-2 rounded-full px-3 py-4 shadow-[0_20px_42px_-28px_color-mix(in_oklch,var(--primary)_65%,transparent)] transition-all duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-foreground/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55 sm:gap-3 sm:px-5',
        className
      )}
    >
      <CreditCard
        className='size-5 shrink-0 text-foreground'
        aria-hidden='true'
      />
      <span className='truncate font-utekos-text-medium text-lg'>
        {isPending ? 'Åpner...' : 'Gå til kassen'}
      </span>
    </Button>
  )
}
