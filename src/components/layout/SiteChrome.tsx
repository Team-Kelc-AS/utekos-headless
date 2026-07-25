'use client'

import {
  isAssistantExcludedPathname,
  resolveAssistantClientExposure,
  resolveAssistantProductHandle,
  type AssistantExposure
} from '@/lib/customer-assistant/assistantRollout'
import { NavigationProgress } from './NavigationProgress'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

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

function isDesignRoute(pathname: string | null) {
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

    setExposure(
      resolveAssistantClientExposure(
        rolloutPercent,
        storage,
        () => {
          memoryBucketRef.current ??= Math.random()
          return memoryBucketRef.current
        }
      )
    )
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

  return (
    <>
      <NavigationProgress />
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
