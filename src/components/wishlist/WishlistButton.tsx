'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { persistAndReportAddToWishlist } from '@/lib/analytics/persistAndReportAddToWishlist'
import { hasWishlistVariant } from '@/lib/wishlist/wishlistStore'
import { cn } from '@/lib/utils/className'
import UtekosLogo from '@public/icon.png'
import { Heart } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'

const WishlistAccountForm = dynamic(
  () =>
    import('./WishlistAccountForm').then(
      module => module.WishlistAccountForm
    ),
  {
    loading: () => (
      <p role='status' className='text-sm text-foreground'>
        Laster innlogging …
      </p>
    )
  }
)

type WishlistButtonProps = {
  product: ProductCartModel
  variant: ProductPurchaseVariant | null | undefined
  productTitle: string
  returnTo: string
  buttonVariant?: 'icon' | 'labelled'
  surface?: 'chip' | 'plain'
  className?: string
}

export function WishlistButton({
  product,
  variant,
  productTitle,
  returnTo,
  buttonVariant = 'icon',
  surface = 'chip',
  className
}: WishlistButtonProps) {
  const [isWished, setIsWished] = useState(false)
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)

  useEffect(() => {
    const variantId = variant?.id
    const syncTimer = window.setTimeout(() => {
      setIsWished(
        variantId ? hasWishlistVariant(variantId) : false
      )
    }, 0)

    return () => window.clearTimeout(syncTimer)
  }, [variant?.id])

  const isLabelled = buttonVariant === 'labelled'

  function handleWishlistClick() {
    if (!variant) {
      toast.error(
        'Velg en variant før du legger til i ønskelisten'
      )
      return
    }

    const result = persistAndReportAddToWishlist({
      product,
      variant
    })

    if (result.persisted && !result.alreadyPresent) {
      setIsWished(true)
      toast.success(`${productTitle} er lagt til i ønskelisten`)
      setSyncDialogOpen(true)
      return
    }

    if (result.alreadyPresent) {
      setIsWished(true)
      toast.message(`${productTitle} er allerede i ønskelisten`)
      setSyncDialogOpen(true)
      return
    }

    toast.error('Kunne ikke lagre ønskelisten lokalt')
  }

  return (
    <>
      <Button
        type='button'
        variant='ghost'
        size={isLabelled ? 'default' : 'icon-lg'}
        aria-label={
          isWished ?
            `${productTitle} er i ønskelisten`
          : `Legg ${productTitle} til i ønskelisten`
        }
        aria-pressed={isWished}
        data-track='WishlistButtonAddClick'
        onClick={handleWishlistClick}
        className={cn(
          surface === 'plain' ?
            'border-0 bg-transparent text-foreground shadow-none hover:bg-transparent hover:text-heart focus-visible:border-transparent focus-visible:ring-foreground/40'
          : 'border border-border bg-muted text-foreground shadow-[0_12px_30px_-16px_rgba(0,0,0,0.85)] hover:bg-muted/90 hover:text-foreground focus-visible:border-foreground/40 focus-visible:ring-foreground/40',
          isLabelled ?
            'h-11 rounded-full px-4 font-sans text-sm font-semibold'
          : 'size-12 rounded-2xl',
          className
        )}
      >
        <Heart
          className={cn(
            'size-5 stroke-[2.25]',
            surface === 'plain' ?
              cn(
                'fill-transparent stroke-foreground text-foreground transition-colors group-hover/button:fill-heart group-hover/button:stroke-heart group-hover/button:text-heart',
                isWished && 'fill-heart stroke-heart text-heart'
              )
            : 'fill-primary stroke-primary text-primary'
          )}
          aria-hidden='true'
        />
        {isLabelled ?
          <span>
            {isWished ? 'I ønskelisten' : 'Ønskeliste'}
          </span>
        : <span className='sr-only'>
            {isWished ?
              `${productTitle} er i ønskelisten`
            : `Legg ${productTitle} til i ønskelisten`}
          </span>
        }
      </Button>

      <Dialog
        open={syncDialogOpen}
        onOpenChange={setSyncDialogOpen}
      >
        <DialogContent className='max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg gap-0 overflow-y-auto border border-foreground/18 bg-night p-0 text-foreground shadow-[0_32px_90px_-42px_color-mix(in_oklch,var(--background)_92%,black)] ring-1 ring-foreground/8 sm:max-w-lg [&_[data-slot=dialog-close]]:text-foreground [&_[data-slot=dialog-close]]:hover:bg-foreground/10 [&_[data-slot=dialog-close]]:hover:text-foreground'>
          <div className='relative isolate overflow-hidden bg-jungle px-6 pt-7 pb-6 text-foreground sm:px-8'>
            <div
              aria-hidden='true'
              className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_0%,color-mix(in_oklch,var(--dark-teal)_88%,transparent),transparent_46%)]'
            />
            <div className='flex items-center gap-4 pr-6'>
              <div className='relative size-16 shrink-0 rounded-full border border-foreground/18 bg-night p-1 shadow-[0_18px_42px_-28px_color-mix(in_oklch,var(--background)_90%,black)] ring-1 ring-foreground/8'>
                <Image
                  src={UtekosLogo}
                  alt=''
                  width={64}
                  height={64}
                  className='size-full rounded-full object-cover'
                />
                <span className='absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full border-2 border-jungle bg-primary text-primary-foreground'>
                  <Heart
                    className='size-3.5 fill-current stroke-[2.25]'
                    aria-hidden='true'
                  />
                </span>
              </div>
              <DialogHeader className='min-w-0'>
                <DialogTitle className='font-sans text-2xl leading-tight font-extrabold tracking-tight text-balance text-foreground sm:text-3xl'>
                  Utekos ønskeliste
                </DialogTitle>
                <DialogDescription className='font-sans text-sm leading-relaxed text-foreground/78'>
                  Favoritten er tatt vare på
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          <div className='border-t border-foreground/12 bg-night px-5 pt-6 pb-7 text-foreground sm:px-8'>
            {syncDialogOpen ?
              <WishlistAccountForm returnTo={returnTo} />
            : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
