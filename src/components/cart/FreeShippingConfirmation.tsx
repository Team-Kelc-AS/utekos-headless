import { CheckCircleIcon } from 'lucide-react'

export function FreeShippingConfirmation() {
  return (
    <div
      className='animate-fade-in-down text-sm'
      style={{ animationDuration: '0.5s' }}
    >
      <div className='flex items-center justify-center gap-3 rounded-lg border border-light-teal/30 bg-night px-4 py-3 text-foreground'>
        <CheckCircleIcon
          className='h-5 w-5 text-light-teal'
          aria-hidden='true'
        />
        <span className='font-sans font-semibold'>
          Gratulerer, du har fått fri frakt!
        </span>
      </div>
    </div>
  )
}
