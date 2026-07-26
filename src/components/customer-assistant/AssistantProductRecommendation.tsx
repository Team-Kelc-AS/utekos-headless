import type { AssistantRecommendation } from '@/lib/customer-assistant/assistantProtocol'
import { ArrowRightIcon, RulerIcon } from 'lucide-react'
import type { Route } from 'next'
import Image from 'next/image'
import Link from 'next/link'

type AssistantProductRecommendationProps = {
  recommendation: AssistantRecommendation
}

export function AssistantProductRecommendation({
  recommendation
}: AssistantProductRecommendationProps) {
  const { product } = recommendation
  const availableVariants = product.variants
    .filter(variant => variant.availableForSale)
    .slice(0, 4)
  const formattedPrice = new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: product.price.currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number(product.price.amount))
  const productHref = `/produkter/${product.handle}` as Route

  return (
    <article className='overflow-hidden rounded-2xl border border-border bg-card text-card-foreground'>
      {product.image && (
        <div className='relative aspect-[16/9] w-full overflow-hidden bg-muted'>
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes='(max-width: 640px) calc(100vw - 3rem), 24rem'
            className='object-cover'
          />
        </div>
      )}

      <div className='space-y-4 p-4'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <p className='mb-1 font-utekos-text-medium text-xs tracking-wide text-card-foreground/70 uppercase'>
              {recommendation.isPrimary ?
                'Vårt forslag'
              : 'Alternativ'}
            </p>
            <h3 className='font-utekos-text-medium text-lg leading-tight'>
              {product.title}
            </h3>
          </div>
          <p
            className='shrink-0 font-utekos-text-medium'
            aria-label={`Pris ${formattedPrice}`}
          >
            {formattedPrice}
          </p>
        </div>

        <p className='text-sm leading-6 text-card-foreground/85'>
          {recommendation.reason}
        </p>

        <div className='text-sm'>
          {availableVariants.length > 0 ?
            <>
              <p className='font-medium'>Tilgjengelig nå</p>
              <p className='mt-1 text-card-foreground/75'>
                {availableVariants
                  .map(variant =>
                    variant.selectedOptions.length > 0 ?
                      variant.selectedOptions
                        .map(option => option.value)
                        .join(' / ')
                    : variant.title
                  )
                  .join(', ')}
              </p>
            </>
          : <p className='font-medium'>Ikke tilgjengelig nå</p>}
        </div>

        <div className='flex flex-col gap-2 sm:flex-row'>
          <Link
            href={productHref}
            className='hover:bg-primary-hover inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-utekos-text-medium text-sm text-primary-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none'
          >
            Se produkt
            <ArrowRightIcon
              className='size-4'
              aria-hidden='true'
            />
          </Link>
          <Link
            href={'/handlehjelp/storrelsesguide' as Route}
            className='inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 font-utekos-text-medium text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none'
          >
            <RulerIcon className='size-4' aria-hidden='true' />
            Størrelsesguide
          </Link>
        </div>
      </div>
    </article>
  )
}
