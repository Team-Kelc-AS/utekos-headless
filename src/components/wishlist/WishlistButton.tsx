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
import { Heart, ShieldCheck } from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { ShopifyProduct } from 'types/product/ShopifyProduct'
import type { ShopifyProductVariant } from 'types/product/ShopifyProductVariant'
import { buildCustomerLoginHref } from './buildCustomerLoginHref'

type WishlistButtonProps = {
  product: ShopifyProduct
  variant: ShopifyProductVariant | null | undefined
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
          'border border-white/70 bg-cyan-500 text-[#172744] shadow-[0_12px_30px_-16px_rgba(0,0,0,0.85)] hover:bg-cyan-400 hover:text-[#172744] focus-visible:border-white focus-visible:ring-white/70 dark:bg-cyan-500 dark:text-[#172744] dark:hover:bg-cyan-400 dark:hover:text-[#172744]',
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
        <DialogContent className='overflow-hidden p-0 sm:max-w-lg'>
          <div className='bg-card px-6 pt-7 pb-6 text-card-foreground sm:px-8'>
            <div className='mb-5 flex size-14 items-center justify-center rounded-2xl bg-cyan-500 text-[#172744]'>
              <Heart
                className='size-7 fill-current stroke-[2.25]'
                aria-hidden='true'
              />
            </div>
            <DialogHeader className='pr-8'>
              <DialogTitle className='font-utekos-text-medium text-2xl leading-tight text-card-foreground'>
                Lagret lokalt — synk med konto?
              </DialogTitle>
              <DialogDescription className='text-base leading-7 text-card-foreground/80 dark:text-card-foreground/80'>
                Varene er lagret i denne nettleseren. Logg inn
                hvis du vil synke ønskelisten med kontoen din
                senere.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className='space-y-5 bg-popover px-6 pt-1 pb-7 text-popover-foreground sm:px-8'>
            <div className='dark:border-dark-border dark:bg-dark-muted/30 flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4'>
              <ShieldCheck
                className='mt-0.5 size-5 shrink-0 text-sidebar-primary'
                aria-hidden='true'
              />
              <p className='text-sm leading-6 text-muted-foreground dark:text-popover-foreground'>
                Innlogging håndteres sikkert av Shopify. Åpning
                av innlogging sender ikke et nytt
                analytics-event.
              </p>
            </div>

            <DialogFooter className='grid gap-3 sm:grid-cols-2'>
              <Button
                asChild
                variant='commerce-primary'
                size='lg'
                className='min-h-12 rounded-full bg-cyan-500 px-6 text-base text-[#172744] shadow-sm hover:bg-cyan-400 hover:text-[#172744] dark:bg-cyan-500 dark:text-[#172744] dark:hover:bg-cyan-400 dark:hover:text-[#172744]'
              >
                <Link
                  href={loginHref}
                  data-track='WishlistLoginClick'
                >
                  Logg inn
                </Link>
              </Button>
              <Button
                asChild
                variant='outline'
                size='lg'
                className='min-h-12 rounded-full px-6 text-base'
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
