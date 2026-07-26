'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MinusIcon, PlusIcon } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import type { AddToCartFormValues } from 'types/cart'

export function QuantitySelector() {
  const { watch, setValue } =
    useFormContext<AddToCartFormValues>()
  const quantity = watch('quantity')

  const updateQuantity = (newQuantity: number) => {
    const validQuantity = Math.max(1, newQuantity || 1)
    setValue('quantity', validQuantity, { shouldValidate: true })
  }

  return (
    <div className='border-jungle/15 bg-coral-green text-jungle inline-flex h-10 items-center rounded-lg border shadow-[0_14px_32px_-28px_color-mix(in_oklch,var(--jungle)_75%,transparent)] md:mb-3'>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='text-jungle hover:bg-blue-green/45 hover:text-jungle disabled:text-jungle/35 h-full cursor-pointer disabled:cursor-not-allowed'
        onClick={() => updateQuantity(quantity - 1)}
        disabled={quantity <= 1}
      >
        <MinusIcon className='size-4' />
        <span className='sr-only font-utekos-text-medium'>
          Reduser antall
        </span>
      </Button>

      <Input
        aria-label='Antall'
        type='text'
        inputMode='numeric'
        pattern='[0-9]*'
        value={quantity}
        onChange={e =>
          updateQuantity(parseInt(e.target.value, 10))
        }
        className='text-jungle h-full w-10 border-transparent bg-transparent text-center text-base shadow-none focus-visible:ring-0'
      />

      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='text-jungle hover:bg-blue-green/45 hover:text-jungle disabled:text-jungle/35 h-full cursor-pointer disabled:cursor-not-allowed'
        onClick={() => updateQuantity(quantity + 1)}
      >
        <PlusIcon className='size-4' />
        <span className='sr-only'>Øk antall</span>
      </Button>
    </div>
  )
}
