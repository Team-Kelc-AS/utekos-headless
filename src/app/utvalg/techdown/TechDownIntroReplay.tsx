'use client'

import { useEffect } from 'react'

const TECHDOWN_INTRO_SELECTOR = '[data-techdown-intro]'

export function TechDownIntroReplay() {
  useEffect(() => {
    const replayAfterBackForwardCache = (
      event: PageTransitionEvent
    ) => {
      if (
        !event.persisted ||
        window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches
      ) {
        return
      }

      const intro = document.querySelector<HTMLElement>(
        TECHDOWN_INTRO_SELECTOR
      )

      if (!intro) return

      for (const animation of intro.getAnimations({
        subtree: true
      })) {
        animation.cancel()
        animation.play()
      }
    }

    window.addEventListener(
      'pageshow',
      replayAfterBackForwardCache
    )

    return () => {
      window.removeEventListener(
        'pageshow',
        replayAfterBackForwardCache
      )
    }
  }, [])

  return null
}
