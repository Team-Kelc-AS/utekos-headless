'use client'

import {
  useContext,
  useEffect,
  useRef,
  type ReactNode
} from 'react'
import { createPortal } from 'react-dom'
import { useIsMobile } from '@/hooks/useIsMobile'
import styles from './StickyCTA.module.css'
import { StickyCTAEntranceContext } from './StickyCTAEntranceContext'

export function StickyCTASurface({
  children,
  busy = false
}: {
  children: ReactNode
  busy?: boolean
}) {
  const isMobile = useIsMobile()
  const entranceReady = useContext(StickyCTAEntranceContext)
  const visible = entranceReady && !busy
  const reserveRef = useRef<HTMLDivElement>(null)
  const shellRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const shell = shellRef.current
    const reserve = reserveRef.current
    if (!isMobile || !shell || !reserve) return
    const measure = () => {
      const offset =
        shell.getBoundingClientRect().height +
        parseFloat(getComputedStyle(shell).bottom) +
        12
      reserve.style.height = `${offset}px`
      document.documentElement.style.setProperty(
        '--sticky-cta-offset',
        `${offset}px`
      )
    }
    const observer = new ResizeObserver(measure)
    observer.observe(shell)
    measure()
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty(
        '--sticky-cta-offset'
      )
    }
  }, [isMobile])

  // The body portal escapes transformed page sections and reserves room after the footer.
  return isMobile ?
      createPortal(
        <div ref={reserveRef} className={styles.reserve}>
          <aside
            ref={shellRef}
            className={styles.shell}
            aria-label='Hurtigbestilling'
            aria-busy={busy}
            data-visible={visible}
            inert={!visible}
          >
            {children}
          </aside>
        </div>,
        document.body
      )
    : null
}
