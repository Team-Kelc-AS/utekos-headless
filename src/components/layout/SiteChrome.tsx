'use client'

import {
  isAssistantExcludedPathname,
  resolveAssistantClientExposure,
  resolveAssistantProductHandle,
  type AssistantExposure
} from '@/lib/customer-assistant/assistantRollout'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { isNewsletterModalExcludedPath } from '@/components/newsletter-modal/newsletterModalConfig'

import { NavigationProgress } from './NavigationProgress'

const NewsletterSignupDialog = dynamic(
  () =>
    import(
      '@/components/newsletter-modal/NewsletterSignupDialog'
    ).then(module => module.NewsletterSignupDialog),
  { ssr: false }
)

const CustomerAssistant = dynamic(
  () =>
    import('@/components/customer-assistant/CustomerAssistant').then(
      module => module.CustomerAssistant
    ),
  { ssr: false }
)

type SiteChromeProps = {
  assistantRolloutPercent: number
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

function AssistantRolloutMount({
  memoryBucketRef,
  pathname,
  rolloutPercent
}: {
  memoryBucketRef: { current: number | null }
  pathname: string | null
  rolloutPercent: number
}) {
  const [exposure, setExposure] =
    useState<AssistantExposure>('holdout')

  useEffect(() => {
    let storage: Storage | null = null

    try {
      storage = window.localStorage
    } catch {}

    const nextExposure = resolveAssistantClientExposure(
      rolloutPercent,
      storage,
      () => {
        memoryBucketRef.current ??= Math.random()
        return memoryBucketRef.current
      }
    )
    const syncTimer = window.setTimeout(
      () => setExposure(nextExposure),
      0
    )

    return () => window.clearTimeout(syncTimer)
  }, [memoryBucketRef, rolloutPercent])

  if (exposure !== 'assistant') return null

  return (
    <CustomerAssistant
      rolloutPercent={rolloutPercent}
      productHandle={resolveAssistantProductHandle(pathname)}
    />
  )
}

export function SiteChrome({
  assistantRolloutPercent,
  children,
  header,
  footer
}: SiteChromeProps) {
  const pathname = usePathname()
  const assistantMemoryBucketRef = useRef<number | null>(null)

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

      {assistantRolloutPercent > 0 &&
        !isAssistantExcludedPathname(pathname) && (
          <AssistantRolloutMount
            memoryBucketRef={assistantMemoryBucketRef}
            pathname={pathname}
            rolloutPercent={assistantRolloutPercent}
          />
        )}
    </>
  )
}
