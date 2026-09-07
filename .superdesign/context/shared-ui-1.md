# Full source bundle for Superdesign

Complete selected UI sources, grouped only to respect the service file-count and 50,000-character per-file limits. No source content is removed. Refresh from listed files before reuse if their source hashes change.

## src/components/header/Header.tsx

```tsx
// Path: src/components/header/Header.tsx

import { Cart } from '@/components/cart/Cart'
import { HeaderSearch } from '@/components/header/HeaderSearch/HeaderSearch'
import type { MenuItem } from '@types'
import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { HeadphonesIcon } from 'lucide-react'
import { ClientMobileMenu } from './ClientMobileMenu'
import wordmarkwhite from '@/assets/images/brand/WordmarkWhite.svg'

export default function Header({
  menu
}: {
  menu: MenuItem[]
}) {
  return (
    <header
      data-site-header
      className='top-0! z-50 bg-night w-full text-foreground'
    >
      <div className='relative mx-auto grid min-h-18 w-full grid-cols-[auto_1fr] items-center gap-3 px-4 py-2.5 sm:px-6 lg:min-h-20 lg:px-10 xl:min-h-22.5'>
        <div
          data-header-part='brand'
          className='flex min-w-0 items-center justify-start'
        >
          <Link
            href={'/' as Route}
            aria-label='Utekos - Til forsiden'
            data-track='HeaderLogoClick'
            className='flex h-14 items-center pl-2 lg:h-16'
          >
            <Image
              src='/IconWhite.svg'
              alt=''
              width={1280}
              height={1109}
              loading='eager'
              fetchPriority='high'
              className='h-8 w-auto sm:hidden'
            />
            <Image
              src={wordmarkwhite}
              alt=''
              width={300}
              height={73}
              loading='eager'
              fetchPriority='high'
              className='hidden h-7 w-auto sm:block sm:h-8 lg:h-9 xl:h-10'
            />
          </Link>
        </div>

        <div
          data-header-part='actions'
          className='flex min-w-0 items-center justify-end gap-1.5 sm:gap-2 lg:gap-3'
        >
          <HeaderSearch variant='nav' />

          <Link
            href={'/kontaktskjema' as Route}
            data-track='HeaderCustomerServiceClick'
            className='hidden h-11 min-w-31 items-center justify-center gap-2 rounded-md px-3 font-utekos-text-medium text-sm text-foreground transition outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring md:inline-flex'
          >
            <HeadphonesIcon
              className='size-4'
              aria-hidden
            />
            <span>Kundeservice</span>
          </Link>

          <Cart
            showLabel
            className='h-11 min-w-11 rounded-md border-transparent bg-transparent px-0 text-foreground hover:bg-accent hover:text-accent-foreground md:min-w-29 md:px-3'
          />

          <ClientMobileMenu menu={menu} />
        </div>
      </div>
    </header>
  )
}
```

## src/components/navigation/UtekosBreadcrumbBar.tsx

```tsx
import Link from 'next/link'
import type { Route } from 'next'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import {
  breadcrumbSurfaceStyles,
  isEmbeddedSurface,
  type BreadcrumbNavItem,
  type BreadcrumbSurface
} from '@/lib/navigation/breadcrumbVariants'
import { cn } from '@/lib/utils/className'

type UtekosBreadcrumbBarProps = {
  items: BreadcrumbNavItem[]
  surface: BreadcrumbSurface
  className?: string
  containerClassName?: string
  listClassName?: string
  embedded?: boolean
}

export function UtekosBreadcrumbBar({
  items,
  surface,
  className,
  containerClassName,
  listClassName,
  embedded
}: UtekosBreadcrumbBarProps) {
  const styles = breadcrumbSurfaceStyles[surface]
  const stripeless = isEmbeddedSurface(surface)
  const showColoredStripe =
    !embedded && !stripeless && Boolean(styles.stripe)

  const breadcrumb = (
    <Breadcrumb className={className}>
      <BreadcrumbList className={cn(styles.list, listClassName)}>
        {items.flatMap((item, index) => {
          const isLast = index === items.length - 1
          const nodes: React.ReactNode[] = []

          if (index > 0) {
            nodes.push(
              <BreadcrumbSeparator
                key={`breadcrumb-separator-${item.label}`}
                className={styles.separator}
              />
            )
          }

          nodes.push(
            <BreadcrumbItem
              key={`breadcrumb-item-${item.label}`}
            >
              {isLast || !item.href ?
                <BreadcrumbPage className={styles.page}>
                  {item.label}
                </BreadcrumbPage>
              : <BreadcrumbLink
                  className={styles.link}
                  render={<Link href={item.href as Route} />}
                >
                  {item.label}
                </BreadcrumbLink>
              }
            </BreadcrumbItem>
          )

          return nodes
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )

  if (embedded) {
    return breadcrumb
  }

  if (showColoredStripe) {
    return (
      <article className={cn('w-full', styles.stripe)}>
        <div
          className={cn(
            'container mx-auto w-full px-4 py-5',
            containerClassName
          )}
        >
          {breadcrumb}
        </div>
      </article>
    )
  }

  return (
    <div
      className={cn(
        'container mx-auto w-full px-4 py-5',
        containerClassName
      )}
    >
      {breadcrumb}
    </div>
  )
}
```

## src/lib/navigation/breadcrumbVariants.ts

```tsx
/**
 * Breadcrumb surface tokens — WCAG 2.2 AAA-oriented pairs.
 *
 * Verified pairs (approximate, from design tokens):
 * - light:    fg #f0eee9 on bg #010214  → ~15.8:1 (1.4.3 AAA)
 * - dark:     fg #f0eee9 on bg #010214  → ~15.8:1 (1.4.3 AAA)
 * - inverted: fg #010214 on bg #f0eee9  → ~15.8:1 (1.4.3 AAA)
 * - transparent: inherits parent `color`; contrast is the parent’s responsibility.
 *
 * Link opacities use /85 (not /72) to preserve ≥7:1 on muted states.
 * Separators use /55 — non-text UI, ≥3:1 vs adjacent (1.4.11 AA).
 * light surface hover uses ceramic (not primary): primary on dark bg ≈3.85:1 (fails 1.4.3 normal text).
 */

export type BreadcrumbSurface =
  | 'light'
  | 'dark'
  | 'inverted'
  | 'transparent'
  | 'transparentDark'
  | 'embeddedLight'
  | 'embeddedDark'

export type BreadcrumbNavItem = { label: string; href?: string }

export type BreadcrumbSurfaceStyles = {
  stripe: string
  list: string
  link: string
  page: string
  separator: string
}

const lightText: BreadcrumbSurfaceStyles = {
  stripe:
    'border-b border-border  bg-background text-foreground',
  list: 'text-foreground',
  link: 'text-foreground/85 transition-colors hover:text-ceramic focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceramic/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  page: 'font-medium text-foreground',
  separator:
    'text-foreground/55 [&>svg]:text-foreground/55'
}

const darkText: BreadcrumbSurfaceStyles = {
  stripe:
    'border-b border-background/12 bg-foreground text-background',
  list: 'text-background',
  link: 'text-background/85 transition-colors hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/50 focus-visible:ring-offset-2 focus-visible:ring-offset-foreground',
  page: 'font-medium text-background',
  separator:
    'text-background/55 [&>svg]:text-background/55'
}

const invertedText: BreadcrumbSurfaceStyles = {
  stripe:
    'border-b border-background/12 bg-foreground text-background',
  list: 'text-background',
  link: 'text-background/85 transition-colors hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/50 focus-visible:ring-offset-2 focus-visible:ring-offset-foreground',
  page: 'font-medium text-background',
  separator:
    'text-background/55 [&>svg]:text-background/55'
}

const transparentText: BreadcrumbSurfaceStyles = {
  stripe: '',
  list: 'text-inherit',
  link: 'text-inherit/85 transition-colors hover:text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/50 focus-visible:ring-offset-2',
  page: 'font-medium text-inherit',
  separator: 'text-inherit/55 [&>svg]:text-inherit/55'
}

export const breadcrumbSurfaceStyles: Record<
  BreadcrumbSurface,
  BreadcrumbSurfaceStyles
> = {
  light: lightText,
  dark: darkText,
  inverted: invertedText,
  transparent: transparentText,
  /** @deprecated Use `transparent` — kept for backward compatibility. */
  transparentDark: transparentText,
  /** @deprecated Use `transparent` with parent text color. */
  embeddedLight: { ...lightText, stripe: '' },
  /** @deprecated Use `transparent` with parent text color. */
  embeddedDark: { ...darkText, stripe: '' }
}

export function isEmbeddedSurface(
  surface: BreadcrumbSurface
): boolean {
  return breadcrumbSurfaceStyles[surface].stripe === ''
}
```

## src/components/footer/components/Footer.tsx

```tsx
import { CopyrightNotice } from '@/components/footer/components/CopyrightNotice'
import { FooterNavigation } from '@/components/footer/components/FooterNavigation'
import { PaymentMethods } from '@/components/footer/components/PaymentMethods'
import { ConditionalNewsLetter } from '@/components/footer/components/ConditionalNewsletter'

export default function Footer() {
  return (
    <footer className='mt-auto border-t border-border pt-12 pb-4 font-utekos-text text-foreground'>
      <div className='container mx-auto px-4 sm:px-8'>
        <FooterNavigation />
        <ConditionalNewsLetter />
        <PaymentMethods />
        <CopyrightNotice />
      </div>
    </footer>
  )
}
```

## src/components/footer/components/FooterNavigation.tsx

```tsx
// Path: src/components/footer/FooterNavigation.tsx
import { footerConfig } from '@/db/config/footer.config'
import Link from 'next/link'

export function FooterNavigation() {
  return (
    <div className='grid grid-cols-1 gap-8 md:grid-cols-4'>
      {footerConfig.map(section => (
        <div key={section.title}>
          <h3 className='mb-4 font-utekos-text-medium text-lg'>
            {section.title}
          </h3>
          <nav aria-label={`${section.title} navigasjon`}>
            <ul className='space-y-2'>
              {section.links.map(link => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className='font-utekos-text text-base transition-colors hover:text-foreground'
                    {...(link.external && {
                      target: '_blank',
                      rel: 'noopener noreferrer'
                    })}
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      ))}
    </div>
  )
}
```

## src/components/footer/components/NewsLetter.tsx

```tsx
// src/components/footer/components/NewsLetter.tsx

'use client'

import { NewsletterForm } from '@/components/form/components/NewsLetterForm'

export function NewsLetter() {
  return (
    <div className='mt-12 border-t border-neutral-800 pb-12 pt-12'>
      <div className='mx-auto w-full max-w-5xl px-4'>
        <NewsletterForm />
      </div>
    </div>
  )
}
```

## src/components/form/components/NewsLetterForm.tsx

```tsx
// src/components/form/components/NewsLetterForm.tsx

'use client'

import { useActionState, useEffect, useRef } from 'react'
import {
  subscribeToNewsletter,
  type ActionState
} from '@/lib/actions/subscribeToNewsLetters'
import { appendLeadTrackingContext } from '@/lib/analytics/collectLeadFormTrackingContext'
import { pushGenerateLeadToDataLayer } from '@/lib/analytics/pushGenerateLeadToDataLayer'
import { Input } from '@/components/ui/input'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { ArrowRight, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { P } from '@/components/typography/TypographyP'
import { Button } from '@/components/ui/button'
import { NewsletterFormFeedback } from '@/components/form/components/NewsletterFormFeedback'
const initialState: ActionState = { status: 'idle', message: '' }

export function NewsletterForm() {
  const [state, formAction, isPending] = useActionState(
    subscribeToNewsletter,
    initialState
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.status === 'success') {
      if (state.dataLayerEvent) {
        pushGenerateLeadToDataLayer(state.dataLayerEvent)
      }
      toast.success(state.message)
      formRef.current?.reset()
    } else if (state.status === 'error') {
      toast.error(state.message)
    }
  }, [state])

  const handleSubmit = (formData: FormData) => {
    appendLeadTrackingContext(formData)
    formAction(formData)
  }

  return (
    <article className='mx-auto w-full'>
      <section
        aria-labelledby='newsletter-heading'
        className='w-full overflow-hidden rounded-[1.25rem] bg-jungle px-5 py-8 text-white sm:px-10 sm:py-10'
      >
        <div className='mx-auto flex w-full max-w-2xl flex-col items-start gap-4 text-left'>
          <hgroup className='flex flex-col gap-3'>
            <div className='flex items-center gap-4'>
              <span
                aria-hidden='true'
                className='flex size-12 shrink-0 items-center justify-center rounded-full bg-white/14 text-white'
              >
                <Mail className='size-6' />
              </span>

              <h2
                id='newsletter-heading'
                className='scroll-m-20 pb-0 font-sans text-2xl font-bold tracking-tight text-balance text-white md:text-3xl lg:text-3xl'
              >
                Meld deg på Utekos sitt nyhetsbrev!
              </h2>
            </div>

            <div className='flex flex-col gap-1.5 text-white/86'>
              <P
                Text='Som medlem i vår kundeklubb får du personlige varsler om tilbud, salg og kampanjer.'
                className='not-first:mt-0'
              />
              <P
                Text='Du får også tips, inspirasjon og nye artikler fra Utekos-magasinet.'
                className='not-first:mt-0'
              />
            </div>
          </hgroup>

          <form
            ref={formRef}
            action={handleSubmit}
            className='mt-2 flex w-full flex-col gap-3 sm:flex-row sm:items-center'
          >
            <label
              htmlFor='newsletter-email'
              className='sr-only'
            >
              Din e-postadresse
            </label>

            <Input
              id='newsletter-email'
              type='email'
              name='email'
              autoComplete='email'
              placeholder='Din e-postadresse…'
              required
              className='h-12 w-full rounded-full border-white/55 bg-white px-5 text-base text-[#222222] placeholder:text-[#606568] md:text-base'
            />

            <BrandBadge
              asChild
              bgColor='var(--primary)'
              fgColor='var(--primary-foreground)'
              className='hover:bg-primary-hover h-12 w-full shrink-0 bg-primary px-6 py-0 font-utekos-text-medium text-base text-primary-foreground transition-colors duration-300 sm:w-auto'
            >
              <Button
                type='submit'
                disabled={isPending}
                aria-busy={isPending}
                className='group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60'
              >
                {isPending ? 'Sender…' : 'Meld meg inn'}
                <ArrowRight className='ml-2 size-5 transition-transform duration-300 group-hover:translate-x-1' />
              </Button>
            </BrandBadge>
          </form>

          <NewsletterFormFeedback state={state} />
        </div>
      </section>
    </article>
  )
}
```

## src/components/footer/components/PaymentMethods.tsx

```tsx
const PAY_ICONS_MOBILE =
  'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/PayIconsMobile.webp?v=1784837536'
const PAY_ICONS_IPAD =
  'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/PayIconsIpad.webp?v=1784837673'
const PAY_ICONS_DESKTOP =
  'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/FooterPayIcons.webp?v=1784837537'

const ALT =
  'Betalingsmetoder: Klarna, Vipps, Visa og Mastercard'

export function PaymentMethods() {
  return (
    <div className='mt-12 border-t border-border pt-8'>
      <picture className='mx-auto block w-full max-w-5xl'>
        <source
          media='(min-width: 1024px)'
          srcSet={PAY_ICONS_DESKTOP}
        />
        <source
          media='(min-width: 768px)'
          srcSet={PAY_ICONS_IPAD}
        />
        <img
          src={PAY_ICONS_MOBILE}
          alt={ALT}
          width={390}
          height={50}
          className='mx-auto h-auto w-full max-w-5xl'
        />
      </picture>
    </div>
  )
}
```

## src/db/config/footer.config.ts

```tsx
// Path: src/config/footer.config.ts
import type { Route } from 'next'
import type { FooterSection } from '@types'

export const footerConfig: FooterSection[] = [
  {
    title: 'Handlehjelp',
    links: [
      {
        title: 'Kontakt oss',
        path: '/kontaktskjema' as Route,
        trackingEvent: 'FooterContactClick'
      },
      {
        title: 'Teknologi og materialer',
        path: '/handlehjelp/teknologi-materialer' as Route,
        trackingEvent: 'FooterTechMaterialsClick'
      },
      {
        title: 'Vask og vedlikehold',
        path: '/handlehjelp/vask-og-vedlikehold' as Route,
        trackingEvent: 'FooterWashMaintenanceClick'
      },
      {
        title: 'Størrelses­guide',
        path: '/handlehjelp/storrelsesguide' as Route,
        trackingEvent: 'FooterSizeGuideClick'
      }
    ]
  },
  {
    title: 'Kundeservice',
    links: [
      {
        title: 'Kundeservice',
        path: '/kontaktskjema' as Route,
        trackingEvent: 'FooterCustomerServicePageClick'
      },
      {
        title: 'Tlf: +47 40 21 63 43',
        path: 'tel:+4740216343' as Route,
        external: true,
        trackingEvent: 'FooterPhoneClick'
      },
      {
        title: 'E-post: kundeservice@utekos.no',
        path: 'mailto:kundeservice@utekos.no' as Route,
        external: true,
        trackingEvent: 'FooterEmailClick'
      }
    ]
  },
  {
    title: 'Informasjon',
    links: [
      {
        title: 'Om oss',
        path: '/om-oss' as Route,
        trackingEvent: 'FooterAboutUsClick'
      },
      {
        title: 'Frakt og retur',
        path: '/frakt-og-retur' as Route,
        trackingEvent: 'FooterShippingReturnClick'
      },
      {
        title: 'Personvern',
        path: '/personvern' as Route,
        trackingEvent: 'FooterPrivacyClick'
      },
      {
        title: 'Vilkår og betingelser',
        path: '/vilkar-betingelser' as Route,
        trackingEvent: 'FooterTermsConditionsClick'
      }
    ]
  },
  {
    title: 'Bedriftsinformasjon',
    links: [
      {
        title: 'KELC AS',
        path: '/' as Route,
        trackingEvent: 'FooterKelcAsClick'
      },
      {
        title: 'Lille Damsgårdsveien 25',
        path: 'map:Lille Damsgårdsveien 25' as Route,
        external: true,
        trackingEvent: 'FooterAddressClick'
      },
      {
        title: '5162, Laksevåg',
        path: 'map:Lille Damsgårdsveien 25, 5162, Bergen' as Route,
        external: true,
        trackingEvent: 'FooterCityClick'
      },
      {
        title: 'Org.nr 925 820 393',
        path: '/kontaktskjema' as Route,
        trackingEvent: 'FooterOrgNrClick'
      }
    ]
  }
]
```

## src/components/ui/button.tsx

```tsx
import * as React from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils/className'

const buttonVariants = cva(
  'group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
  {
    variants: {
      variant: {
        'alternate':
          'bg-alternate-button text-foreground hover:scale-104 hover:bg-[#12403C]',
        'checkout':
          'bg-primary text-foreground hover:text-foreground/90 rounded-2xl hover:opacity-60 hover:scale-103',
        'commerce-primary':
          'bg-primary text-foreground hover:opacity-60 rounded-2xl',
        'commerce-secondary':
          'border-commerce-secondary bg-commerce-secondary text-commerce-secondary-foreground hover:bg-commerce-secondary-hover hover:text-commerce-secondary-hover-foreground',
        'default':
          'hover:bg-primary-hover bg-primary text-primary-foreground',
        'outline':
          'border-input bg-background hover:bg-accent hover:text-accent-foreground',
        'seeProduct':
          'border-border bg-sidebar-primary text-foreground shadow-xs aria-expanded:bg-accent aria-expanded:text-accent-foreground',
        'secondary':
          'bg-secondary text-secondary-foreground aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        'ghost':
          'text-foreground hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground',
        'destructive':
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:border-destructive focus-visible:ring-destructive/30',
        'link':
          'text-primary underline-offset-4 hover:underline',
        'utekos':
          'bg-primary text-foreground hover:opacity-60 rounded-2xl'
      },
      size: {
        'default':
          'h-9 gap-1.5 px-3 in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        'xs': 'h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*="size-"])]:size-3',
        'sm': 'h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5',
        'lg': 'h-10 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        'icon': 'size-9',
        'icon-xs':
          'size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*="size-"])]:size-3',
        'icon-sm':
          'size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg',
        'icon-lg': 'size-10'
      }
    },
    defaultVariants: { variant: 'default', size: 'default' }
  }
)

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }

function Button({
  asChild = false,
  className,
  children,
  nativeButton,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  const buttonClassName = cn(
    buttonVariants({ variant, size, className })
  )

  if (asChild && React.isValidElement(children)) {
    const child = React.Children.only(
      children
    ) as React.ReactElement<{ className?: string }>

    return React.cloneElement(child, {
      ...(props as Record<string, unknown>),
      'data-slot': 'button',
      'className': cn(buttonClassName, child.props.className)
    } as React.Attributes & {
      'className'?: string
      'data-slot': string
    })
  }

  return (
    <ButtonPrimitive
      data-slot='button'
      className={buttonClassName}
      nativeButton={nativeButton}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  )
}

function AddToCartButton() {
  return (
    <button
      className={cn(
        'font-google-sans transform rounded-full px-12 py-4 font-utekos-text font-bold tracking-normal transition-colors duration-200 hover:scale-105'
      )}
    >
      Legg i handlekurv
    </button>
  )
}

function CheckoutButton() {
  return (
    <button
      className={cn(
        'transform rounded-full px-12 py-4 font-sans tracking-normal transition-colors duration-200 hover:scale-105'
      )}
    >
      Gå til kassen
    </button>
  )
}

function UtekosButton() {
  return (
    <Button variant='utekos' size='default'>
      Utekos
    </Button>
  )
}

export {
  Button,
  buttonVariants,
  AddToCartButton,
  CheckoutButton,
  UtekosButton
}
```

## src/components/ui/card.tsx

```tsx
import * as React from 'react'

import { cn } from '@/lib/utils/className'

function Card({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
  return (
    <div
      data-slot='card'
      data-size={size}
      className={cn(
        'group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground shadow-xs ring-1 ring-foreground/10 [--card-spacing:--spacing(6)] has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(4)] *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl',
        className
      )}
      {...props}
    />
  )
}

function CardHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-header'
      className={cn(
        'group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)',
        className
      )}
      {...props}
    />
  )
}

function CardTitle({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-title'
      className={cn(
        'font-utekos-text-medium leading-normal tracking-normal text-wrap text-foreground group-data-[size=sm]/card:text-sm md:text-pretty',
        className
      )}
      {...props}
    />
  )
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-description'
      className={cn(
        'text-description-foreground text-base tracking-wide',
        className
      )}
      {...props}
    />
  )
}

function CardAction({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-action'
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className
      )}
      {...props}
    />
  )
}

function CardContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-content'
      className={cn('px-4 text-foreground', className)}
      {...props}
    />
  )
}

function CardFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-footer'
      className={cn(
        'flex items-center rounded-b-xl px-4 [.border-t]:pt-(--card-spacing)',
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent
}
```

## src/components/ui/table.tsx

```tsx
'use client'

import * as React from 'react'

import { cn } from '@/lib/utils/className'

function Table({
  className,
  ...props
}: React.ComponentProps<'table'>) {
  return (
    <div
      data-slot='table-container'
      className='relative w-full overflow-x-auto'
    >
      <table
        data-slot='table'
        className={cn(
          'w-full caption-bottom text-sm',
          className
        )}
        {...props}
      />
    </div>
  )
}

function TableHeader({
  className,
  ...props
}: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot='table-header'
      className={cn('[&_tr]:border-b', className)}
      {...props}
    />
  )
}

function TableBody({
  className,
  ...props
}: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot='table-body'
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
}

function TableFooter({
  className,
  ...props
}: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot='table-footer'
      className={cn(
        'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    />
  )
}

function TableRow({
  className,
  ...props
}: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot='table-row'
      className={cn(
        'border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  )
}

function TableHead({
  className,
  ...props
}: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot='table-head'
      className={cn(
        'h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
}

function TableCell({
  className,
  ...props
}: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot='table-cell'
      className={cn(
        'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot='table-caption'
      className={cn(
        'mt-4 text-sm text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption
}
```

## src/components/ui/badge.tsx

```tsx
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/className'

const badgeVariants = cva(
  'group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-sm font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        popover:
          'bg-popover text-foreground hover:scale-102 hover:bg-popover/80',
        default:
          'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        secondary:
          'bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80',
        promo: 'bg-badge py-6 px-6 font-utekos-text-medium tracking-normal text-foreground rounded-xl',
        destructive:
          'bg-destructive/10 text-destructive focus-visible:ring-destructive/20 [a]:hover:bg-destructive/20',
        outline:
          'border-border bg-background text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground',
        ghost:
          'hover:bg-muted hover:text-muted-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
      }
    },
    defaultVariants: { variant: 'default' }
  }
)

function Badge({
  className,
  variant = 'default',
  render,
  ...props
}: useRender.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      { className: cn(badgeVariants({ variant }), className) },
      props
    ),
    render,
    state: { slot: 'badge', variant }
  })
}

export { Badge, badgeVariants }
```

## src/components/ui/breadcrumb.tsx

```tsx
import type { HTMLAttributes } from 'react'
import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cn } from '@/lib/utils/className'
import {
  ChevronRightIcon,
  MoreHorizontalIcon
} from 'lucide-react'

function Breadcrumb({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <nav
      aria-label='breadcrumb'
      data-slot='breadcrumb'
      className={cn(className)}
      {...props}
    />
  )
}

function BreadcrumbList({
  className,
  ...props
}: HTMLAttributes<HTMLOListElement>) {
  return (
    <ol
      data-slot='breadcrumb-list'
      className={cn(
        'flex flex-wrap items-center gap-1.5 text-sm wrap-break-word text-muted-foreground sm:gap-2.5',
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({
  className,
  ...props
}: HTMLAttributes<HTMLLIElement>) {
  return (
    <li
      data-slot='breadcrumb-item'
      className={cn(
        'inline-flex items-center gap-1.5',
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbLink({
  className,
  render,
  ...props
}: useRender.ComponentProps<'a'>) {
  return useRender({
    defaultTagName: 'a',
    props: mergeProps<'a'>(
      {
        className: cn(
          'text-muted-foreground transition-colors hover:text-foreground',
          className
        )
      },
      props
    ),
    render,
    state: { slot: 'breadcrumb-link' }
  })
}

function BreadcrumbPage({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot='breadcrumb-page'
      role='link'
      aria-disabled='true'
      aria-current='page'
      className={cn('font-normal text-foreground', className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLLIElement> & {
  children?: React.ReactNode
}) {
  return (
    <li
      data-slot='breadcrumb-separator'
      role='presentation'
      aria-hidden='true'
      className={cn('[&>svg]:size-3.5', className)}
      {...props}
    >
      {children ?? <ChevronRightIcon />}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot='breadcrumb-ellipsis'
      role='presentation'
      aria-hidden='true'
      className={cn(
        'flex size-5 items-center justify-center [&>svg]:size-4',
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon />
      <span className='sr-only'>More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis
}
```

## src/components/BrandComponents/utils/BrandBadge.tsx

```tsx
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils/className'
import {
  Children,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  cloneElement
} from 'react'
import type { LucideIcon } from 'lucide-react'
import { cva, type VariantProps } from '@/lib/utils/className'

const brandBadgeVariants = cva(
  'inline-flex items-center justify-center rounded-full px-8 py-4 text-lg leading-[1.35] tracking-[-0.01em] whitespace-nowrap drop-shadow-lg/50',
  {
    variants: {
      variant: { default: '' },
      tone: {
        'neutral':
          ' bg-card text-card-foreground',
        'promo':
          'bg-promo text-promo-foreground',
        'commerce-primary':
          'bg-commerce-primary text-commerce-primary-foreground hover:bg-commerce-primary-hover hover:text-commerce-primary-hover-foreground',
        'commerce-secondary':
          'bg-commerce-secondary text-commerce-secondary-foreground hover:bg-commerce-secondary-hover hover:text-commerce-secondary-hover-foreground',
        'featured':
          'bg-featured text-foreground',
        'custom':
          'bg-(--brand-badge-bg) text-(--brand-badge-text)'
      }
    },
    defaultVariants: { variant: 'default', tone: 'neutral' }
  }
)

interface BrandBadgeProps
  extends
    HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof brandBadgeVariants> {
  label?: string
  asChild?: boolean
  icon?: LucideIcon
  iconColor?: string
  children?: ReactNode
  bgColor?: string
  fgColor?: string
  /** Alias for `bgColor`; used by existing call sites. */
  backgroundColor?: string
  /** Alias for `fgColor`; used by existing call sites. */
  textColor?: string
  /**
   * @deprecated Use `tone` so surface and foreground remain auditable.
   */
  iconBorderColor?: string
}

export default function BrandBadge({
  label,
  icon: Icon,
  iconColor,
  asChild = false,
  variant = 'default',
  tone = 'neutral',
  className = '',
  bgColor,
  fgColor,
  backgroundColor,
  textColor,
  children,
  style,
  ...rest
}: BrandBadgeProps) {
  const resolvedBg = bgColor ?? backgroundColor
  const resolvedFg = fgColor ?? textColor
  const effectiveTone =
    resolvedBg || resolvedFg ? 'custom' : tone
  const mergedStyle = {
    ...style,
    '--brand-badge-bg': resolvedBg ?? 'var(--card)',
    '--brand-badge-text': resolvedFg ?? 'var(--card-foreground)'
  } as CSSProperties

  const iconClassName = cn(
    'size-4 shrink-0 sm:size-5 lg:size-6',
    iconColor ? `fill-${iconColor}` : 'currentColor'
  )
  const iconStyle = iconColor ? { color: iconColor } : undefined

  if (asChild) {
    const [resolvedChild] = Children.toArray(children).filter(
      child =>
        child !== null &&
        (typeof child !== 'string' || child.trim() !== '')
    )
    if (!resolvedChild) {
      return null
    }

    if (!isValidElement(resolvedChild)) {
      return null
    }

    const slotChild =
      Icon ?
        cloneElement(
          resolvedChild as React.ReactElement<
            { children?: ReactNode } & Record<string, unknown>
          >,
          {
            children: (
              <>
                <Icon
                  className={iconClassName}
                  style={iconStyle}
                  aria-hidden='true'
                />
                {
                  (
                    resolvedChild as React.ReactElement<
                      { children?: ReactNode } & Record<
                        string,
                        unknown
                      >
                    >
                  ).props.children
                }
              </>
            )
          }
        )
      : resolvedChild

    return (
      <Slot
        className={cn(
          brandBadgeVariants({ variant, tone: effectiveTone }),
          className
        )}
        style={mergedStyle}
        {...rest}
      >
        {slotChild}
      </Slot>
    )
  }

  return (
    <span
      className={cn(
        brandBadgeVariants({ variant, tone: effectiveTone }),
        className
      )}
      style={mergedStyle}
      {...rest}
    >
      {Icon ?
        <Icon
          className={iconClassName}
          style={iconStyle}
          aria-hidden='true'
        />
      : null}
      {children ?? label}
    </span>
  )
}
```

