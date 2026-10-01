import { getProduct } from '@/api/lib/products/getProduct'
import { requireProductPresentation } from '@/lib/products/presentation'
import Image from 'next/image'
import Link from 'next/link'

export async function SvaleFeatureSection() {
  const presentation = requireProductPresentation('utekos-svale')
  const product = await getProduct(presentation.publicHandle)

  if (!product) return null

  const image = product.featuredImage
  const price = product.priceRange.minVariantPrice
  const formattedPrice = new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: price.currencyCode,
    maximumFractionDigits: 0
  }).format(Number(price.amount))

  return (
    <section
      aria-labelledby='svale-feature-heading'
      className='mb-12 grid gap-8 rounded-3xl border border-border bg-card p-5 text-card-foreground sm:p-8 lg:grid-cols-2 lg:items-center'
    >
      {image && image.width > 0 && image.height > 0 ?
        <Image
          src={image.url}
          alt={image.altText || presentation.media.defaultAlt}
          width={image.width}
          height={image.height}
          sizes='(min-width: 1024px) 50vw, 100vw'
          className='block h-auto w-full rounded-2xl'
          quality={95}
        />
      : null}
      <div className='space-y-5 font-google-sans font-medium'>
        <h2
          id='svale-feature-heading'
          className='text-3xl font-extrabold sm:text-4xl'
        >
          {presentation.displayName}
        </h2>
        <p className='max-w-prose text-lg'>
          {presentation.description}
        </p>
        <p className='text-2xl'>{formattedPrice}</p>
        <Link
          href='/produkter/utekos-svale'
          className='inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring'
        >
          Se Utekos Svale
        </Link>
      </div>
    </section>
  )
}
