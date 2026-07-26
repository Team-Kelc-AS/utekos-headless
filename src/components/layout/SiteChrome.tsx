'use client'

import { usePathname } from 'next/navigation'

import { NewsletterSignupDialog } from '@/components/newsletter-modal/NewsletterSignupDialog'
import { isNewsletterModalExcludedPath } from '@/components/newsletter-modal/newsletterModalConfig'

import { NavigationProgress } from './NavigationProgress'

type SiteChromeProps = {
  children: React.ReactNode
  header: React.ReactNode
  footer: React.ReactNode
}

function isDesignRoute(pathname: string | null): boolean {
  if (!pathname) {
    return false
  }

  return (
    pathname === '/design' || pathname.startsWith('/design/')
  )
}

export function SiteChrome({
  children,
  header,
  footer
}: SiteChromeProps) {
  const pathname = usePathname()

  if (isDesignRoute(pathname)) {
    return children
  }

  const showNewsletterModal =
    !isNewsletterModalExcludedPath(pathname)

  return (
    <>
      <NavigationProgress />

      {showNewsletterModal ?
        <NewsletterSignupDialog />
      : null}

      {header}

      <main>{children}</main>

      {footer}
    </>
  )
}
