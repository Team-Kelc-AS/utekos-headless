import { PurchasesOutlineIcon } from '@/components/utekos-icons'
'use client'

export function LandingCartButton({
  className
}: {
  className?: string
}) {
  return (
    <button
      type='button'
      aria-label='Åpne handlekurven'
      onClick={() =>
        window.dispatchEvent(new Event('utekos:landing:cart'))
      }
      className={className}
    >
      <PurchasesOutlineIcon tone="orange" className='size-5' aria-hidden />
      <span className='sr-only'>Åpne handlekurven</span>
    </button>
  )
}
