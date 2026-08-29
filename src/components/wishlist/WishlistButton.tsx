'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { persistAndReportAddToWishlist } from '@/lib/analytics/persistAndReportAddToWishlist'
import { hasWishlistVariant } from '@/lib/wishlist/wishlistStore'
import { cn } from '@/lib/utils/className'
import UtekosLogo from '@public/icon.png'
import { Heart } from 'lucide-react'
import type { Route } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type {
  ProductCartModel,
  ProductPurchaseVariant
} from 'types/product/ProductPurchaseModel'
import { buildCustomerLoginHref } from './buildCustomerLoginHref'

type WishlistButtonProps = {
  product: ProductCartModel
  variant: ProductPurchaseVariant | null | undefined
  productTitle: string
  returnTo: string
  buttonVariant?: 'icon' | 'labelled'
  className?: string
}

export function WishlistButton({
  product,
  variant,
  productTitle,
  returnTo,
  buttonVariant = 'icon',
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

  const loginHref = buildCustomerLoginHref({
    mode: 'login',
    returnTo
  }) as Route
  const createAccountHref = buildCustomerLoginHref({
    mode: 'create',
    returnTo
  }) as Route
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

    if (result.emitted) {
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
          'border border-border bg-muted text-foreground shadow-[0_12px_30px_-16px_rgba(0,0,0,0.85)] hover:bg-muted/90 hover:text-foreground focus-visible:border-foreground/40 focus-visible:ring-foreground/40',
          isLabelled ?
            'h-11 rounded-full px-4 font-utekos-text-medium text-sm'
          : 'size-12 rounded-2xl',
          className
        )}
      >
        <Heart
          className={cn(
            'size-5 stroke-[2.25]',
            isWished ? 'fill-current' : 'fill-transparent'
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
        <DialogContent className='overflow-hidden border border-foreground/18 bg-night p-0 text-foreground shadow-[0_32px_90px_-42px_color-mix(in_oklch,var(--background)_92%,black)] ring-1 ring-foreground/8 sm:max-w-lg [&_[data-slot=dialog-close]]:text-foreground [&_[data-slot=dialog-close]]:hover:bg-foreground/10 [&_[data-slot=dialog-close]]:hover:text-foreground'>
          <div className='relative isolate overflow-hidden bg-jungle px-6 pt-7 pb-6 text-foreground sm:px-8'>
            <div
              aria-hidden='true'
              className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_0%,color-mix(in_oklch,var(--dark-teal)_88%,transparent),transparent_46%)]'
            />
            <div className='mb-6 flex items-center gap-3'>
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
              <div className='min-w-0'>
                <p className='font-utekos-text-medium text-sm leading-tight text-foreground'>
                  Utekos ønskeliste
                </p>
                <p className='mt-1 font-utekos-text text-xs leading-relaxed text-foreground/68'>
                  Favoritten er tatt vare på
                </p>
              </div>
            </div>
            <DialogHeader className='pr-8'>
              <DialogTitle className='font-utekos-text-medium text-2xl leading-tight text-balance text-foreground'>
                Du slipper å lete på nytt
              </DialogTitle>
              <DialogDescription className='font-utekos-text text-base leading-7 text-foreground/78 dark:text-foreground/78'>
                Favoritten ligger klar neste gang du besøker oss
                på denne enheten. Vil du gå til kontoen din, kan
                du logge inn eller opprette en konto.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className='border-t border-foreground/12 bg-night px-6 pt-6 pb-7 text-foreground sm:px-8'>
            <DialogFooter className='grid gap-3 sm:grid-cols-2'>
              <Button
                asChild
                variant='default'
                size='lg'
                className='hover:bg-primary-hover min-h-12 rounded-full bg-primary px-6 font-utekos-text-medium text-base text-primary-foreground shadow-[0_18px_40px_-26px_color-mix(in_oklch,var(--primary)_78%,transparent)] hover:text-primary-foreground focus-visible:ring-primary/60 focus-visible:ring-offset-night'
              >
                <Link
                  href={loginHref}
                  data-track='WishlistLoginClick'
                >
                  Gå til innlogging
                </Link>
              </Button>
              <Button
                asChild
                variant='outline'
                size='lg'
                className='min-h-12 rounded-full border-foreground/24 bg-transparent! px-6 font-utekos-text-medium text-base text-foreground hover:bg-foreground/8 hover:text-foreground focus-visible:ring-foreground/45 focus-visible:ring-offset-night dark:border-foreground/24 dark:bg-transparent! dark:text-foreground dark:hover:bg-foreground/8 dark:hover:text-foreground'
              >
                <Link
                  href={createAccountHref}
                  data-track='WishlistCreateAccountClick'
                >
                  Opprett konto
                </Link>
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
