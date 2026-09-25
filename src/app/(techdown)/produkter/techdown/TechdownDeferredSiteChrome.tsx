'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import styles from './TechdownContent.module.css'

const TechdownSiteChrome = dynamic(
  () =>
    import('./TechdownSiteChrome').then(
      module => module.TechdownSiteChrome
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className={styles.siteChromePlaceholder}
        aria-hidden='true'
      />
    )
  }
)

/**
 * Mounts PreFooterNavigation + site Footer only after the document
 * has finished loading and the visitor has scrolled near this sentinel.
 */
export function TechdownDeferredSiteChrome() {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (shouldLoad) return

    const sentinel = sentinelRef.current
    if (!sentinel) return

    let cancelled = false
    let observer: IntersectionObserver | null = null
    let idleId: number | null = null
    let timeoutId: number | null = null

    const idleWindow = window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number }
      ) => number
      cancelIdleCallback?: (id: number) => void
    }

    function observeSentinel() {
      if (cancelled || !sentinel) return

      if (!('IntersectionObserver' in window)) {
        setShouldLoad(true)
        return
      }

      observer = new IntersectionObserver(
        entries => {
          if (!entries.some(entry => entry.isIntersecting)) {
            return
          }
          setShouldLoad(true)
          observer?.disconnect()
        },
        { rootMargin: '320px 0px', threshold: 0 }
      )
      observer.observe(sentinel)
    }

    function afterDocumentLoad() {
      if (cancelled) return

      if (typeof idleWindow.requestIdleCallback === 'function') {
        idleId = idleWindow.requestIdleCallback(observeSentinel, {
          timeout: 2500
        })
        return
      }

      timeoutId = window.setTimeout(observeSentinel, 400)
    }

    if (document.readyState === 'complete') {
      afterDocumentLoad()
    } else {
      window.addEventListener('load', afterDocumentLoad, {
        once: true
      })
    }

    return () => {
      cancelled = true
      window.removeEventListener('load', afterDocumentLoad)
      observer?.disconnect()
      if (idleId !== null) {
        idleWindow.cancelIdleCallback?.(idleId)
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [shouldLoad])

  return (
    <div
      ref={sentinelRef}
      className={styles.deferredSiteChrome}
      data-journey-section='deferred_site_chrome'
    >
      {shouldLoad ?
        <TechdownSiteChrome />
      : <div
          className={styles.siteChromePlaceholder}
          aria-hidden='true'
        />}
    </div>
  )
}
