import { Button } from '@/components/ui/button'
import { cartStore } from '@/lib/state/cartStore'
import { XMarkIcon } from '@heroicons/react/24/outline'

export const CartHeader = () => (
  <div className='flex shrink-0 items-center justify-between border-b border-border bg-background px-6 py-4'>
    <h2 className='font-utekos-text-medium text-lg text-foreground'>
      Handlekurv
    </h2>
    <Button
      size='icon'
      variant='outline'
      onClick={() => cartStore.send({ type: 'CLOSE' })}
      className='h-10 w-10 border-border bg-muted text-foreground hover:bg-accent hover:text-accent-foreground'
    >
      <XMarkIcon className='h-5 w-5' aria-hidden='true' />
      <span className='sr-only'>Lukk handlekurven</span>
    </Button>
  </div>
)
