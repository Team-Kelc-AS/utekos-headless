import { CheckCircleIcon } from 'lucide-react'

export function FreeShippingConfirmation() {
  return (
    <div
      className='animate-fade-in-down text-sm'
      style={{ animationDuration: '0.5s' }}
    >
      <div className='flex items-center justify-center gap-3 rounded-lg border border-secondary/30 bg-muted px-4 py-3 text-foreground'>
        <CheckCircleIcon
          className='h-5 w-5 text-secondary'
          aria-hidden='true'
        />
        <span className='font-utekos-text-medium'>
          Gratulerer, du har fått fri frakt!
        </span>
      </div>
    </div>
  )
}
