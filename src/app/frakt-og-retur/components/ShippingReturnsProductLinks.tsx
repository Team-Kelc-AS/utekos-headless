import type { Route } from 'next'
import Link from 'next/link'

const productLinks = [
  {
    href: '/produkter/utekos-techdown' as Route,
    label: 'TechDown™',
    trackingEvent: 'ShippingReturnsTechDownClick'
  },
  {
    href: '/produkter/utekos-mikrofiber' as Route,
    label: 'Mikrofiber™',
    trackingEvent: 'ShippingReturnsMikrofiberClick'
  },
  {
    href: '/produkter/comfyrobe' as Route,
    label: 'Comfyrobe™',
    trackingEvent: 'ShippingReturnsComfyrobeClick'
  }
] as const

const productLinkClassName =
  'hover:bg-primary-hover flex min-h-12 w-full items-center justify-center rounded-3xl border border-secondary/30 bg-primary px-6 py-3 font-utekos-text-medium text-base font-bold text-secondary-foreground shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none'

export function ShippingReturnsProductLinks() {
  return (
    <nav
      aria-labelledby='shipping-returns-product-links-heading'
      className='container mx-auto mt-12 w-full px-6 sm:mt-16 sm:px-8'
    >
      <h2
        id='shipping-returns-product-links-heading'
        className='font-google-sans mb-5 text-left text-2xl font-bold text-foreground sm:mb-6 sm:text-3xl'
      >
        Finn din Utekos
      </h2>
      <ul className='grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4'>
        {productLinks.map(link => (
          <li key={link.href}>
            <Link
              href={link.href}
              data-track={link.trackingEvent}
              className={productLinkClassName}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
