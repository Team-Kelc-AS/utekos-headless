'use client'

import Image from 'next/image'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject
} from 'react'
import { techdownImages as images } from './techdownImages'
import styles from './TechdownGallery.module.css'

const AXIS_LOCK_PX = 10

type AxisDrag = {
  pointerId: number
  startX: number
  startY: number
  originScroll: number
  axis: 'x' | 'y' | null
}

function useHorizontalSwipe(
  scrollerRef: RefObject<HTMLElement | null>,
  onCommit?: (scrollLeft: number) => void
) {
  const drag = useRef<AxisDrag | null>(null)

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const state = drag.current
      const scroller = scrollerRef.current
      if (!state || state.pointerId !== event.pointerId) return

      if (
        scroller?.hasPointerCapture(event.pointerId)
      ) {
        scroller.releasePointerCapture(event.pointerId)
      }

      if (state.axis === 'x' && scroller) {
        onCommit?.(scroller.scrollLeft)
      }

      scroller?.removeAttribute('data-dragging')
      drag.current = null
    },
    [onCommit, scrollerRef]
  )

  return {
    onPointerDown(event: ReactPointerEvent<HTMLElement>) {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return
      }
      const scroller = scrollerRef.current
      if (!scroller) return

      drag.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originScroll: scroller.scrollLeft,
        axis: null
      }
    },
    onPointerMove(event: ReactPointerEvent<HTMLElement>) {
      const state = drag.current
      const scroller = scrollerRef.current
      if (!state || state.pointerId !== event.pointerId || !scroller) {
        return
      }

      const dx = event.clientX - state.startX
      const dy = event.clientY - state.startY

      if (state.axis === null) {
        if (
          Math.abs(dx) < AXIS_LOCK_PX &&
          Math.abs(dy) < AXIS_LOCK_PX
        ) {
          return
        }

        // Only claim the gesture for the carousel on clear horizontal intent.
        if (Math.abs(dx) <= Math.abs(dy)) {
          drag.current = null
          return
        }

        state.axis = 'x'
        scroller.setPointerCapture(event.pointerId)
        scroller.dataset.dragging = 'true'
      }

      if (state.axis !== 'x') return

      event.preventDefault()
      scroller.scrollLeft = state.originScroll - dx
    },
    onPointerUp: endDrag,
    onPointerCancel: endDrag
  }
}

export function TechdownGallery() {
  const [active, setActive] = useState(0)
  const [requested, setRequested] = useState(() => new Set([0]))
  const [failed, setFailed] = useState(() => new Set<number>())
  const [attempts, setAttempts] = useState<
    Record<number, number>
  >({})
  const viewport = useRef<HTMLDivElement>(null)
  const thumbnails = useRef<HTMLDivElement>(null)
  const activeIndex = useRef(0)
  const loaded = useRef(new Set<number>())

  const request = useCallback((index: number) => {
    if (index < 0 || index >= images.length) return
    setRequested(current =>
      current.has(index) ? current : new Set(current).add(index)
    )
  }, [])

  const select = useCallback(
    (index: number, jump = false) => {
      if (index < 0 || index >= images.length) return
      activeIndex.current = index
      setActive(index)
      request(index)
      if (loaded.current.has(index)) request(index + 1)
      if (jump && viewport.current) {
        // A direct jump never travels past (or requests) intervening slides.
        viewport.current.scrollTo({
          left: index * viewport.current.clientWidth,
          behavior: 'instant'
        })
      }
      const rail = thumbnails.current
      const button = rail?.children[index] as
        | HTMLButtonElement
        | undefined
      if (rail && button) {
        // The positioned rail is the button's offset parent.
        const left = button.offsetLeft
        if (left < rail.scrollLeft)
          rail.scrollTo({ left, behavior: 'instant' })
        else if (
          left + button.offsetWidth >
          rail.scrollLeft + rail.clientWidth
        ) {
          rail.scrollTo({
            left: left + button.offsetWidth - rail.clientWidth,
            behavior: 'instant'
          })
        }
      }
    },
    [request]
  )

  const commitViewportSwipe = useCallback(
    (scrollLeft: number) => {
      const width = viewport.current?.clientWidth ?? 1
      const index = Math.round(scrollLeft / width)
      select(
        Math.max(0, Math.min(images.length - 1, index)),
        true
      )
    },
    [select]
  )

  const viewportSwipe = useHorizontalSwipe(
    viewport,
    commitViewportSwipe
  )
  const thumbnailSwipe = useHorizontalSwipe(thumbnails)

  useEffect(() => {
    const root = viewport.current
    if (!root) return
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (
            !entry.isIntersecting ||
            entry.intersectionRatio <= 0
          )
            continue
          const index = Number(
            (entry.target as HTMLElement).dataset.index
          )
          request(index)
          if (
            entry.intersectionRatio >= 0.6 &&
            root.dataset.dragging !== 'true'
          ) {
            select(index)
          }
        }
      },
      { root, threshold: [0, 0.01, 0.6] }
    )
    for (const slide of root.children) observer.observe(slide)
    const resize = new ResizeObserver(() => {
      if (root.dataset.dragging === 'true') return
      select(activeIndex.current, true)
    })
    resize.observe(root)
    return () => {
      observer.disconnect()
      resize.disconnect()
    }
  }, [request, select])

  function navigate(
    event: KeyboardEvent<HTMLElement>,
    fromThumbnails = false
  ) {
    const destinations: Record<string, number> = {
      ArrowLeft: Math.max(0, activeIndex.current - 1),
      ArrowRight: Math.min(
        images.length - 1,
        activeIndex.current + 1
      ),
      Home: 0,
      End: images.length - 1
    }
    const next = destinations[event.key]
    if (next === undefined) return
    event.preventDefault()
    select(next, true)
    if (fromThumbnails)
      (
        thumbnails.current?.children[next] as HTMLButtonElement
      )?.focus({ preventScroll: true })
  }

  return (
    <section
      aria-label='Produktbilder av Utekos TechDown™'
      aria-roledescription='karusell'
      className={styles.gallery}
    >
      <div
        ref={viewport}
        id='techdown-gallery-slides'
        className={`${styles.viewport} rounded-lg`}
        tabIndex={0}
        role='group'
        aria-label='Hovedbilder. Sveip horisontalt eller bruk piltastene for å bytte bilde.'
        onKeyDown={event => navigate(event)}
        {...viewportSwipe}
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            className={styles.slide}
            data-index={index}
            data-image-id={image.id}
            role='group'
            aria-roledescription='bilde'
            aria-label={`${image.id} av ${images.length}`}
            aria-hidden={active !== index}
          >
            {requested.has(index) && !failed.has(index) && (
              <Image
                key={attempts[index] ?? 0}
                src={image.main}
                alt={image.alt}
                width={image.width}
                height={image.height}
                className={`${styles.mainImage} rounded-lg`}
                sizes='calc(100vw - 48px)'
                quality={80}
                placeholder='empty'
                loading='eager'
                fetchPriority={
                  index === 0 ? 'high'
                  : active === index ?
                    'auto'
                  : 'low'
                }
                draggable={false}
                onLoad={() => {
                  loaded.current.add(index)
                  // Warming a neighbor must not recursively download the whole gallery.
                  if (activeIndex.current === index)
                    request(index + 1)
                }}
                onError={() =>
                  setFailed(current =>
                    new Set(current).add(index)
                  )
                }
              />
            )}
            {failed.has(index) && (
              <div className={styles.error} role='status'>
                <p>Bildet kunne ikke lastes.</p>
                <button
                  type='button'
                  onClick={() => {
                    setAttempts(current => ({
                      ...current,
                      [index]: (current[index] ?? 0) + 1
                    }))
                    setFailed(current => {
                      const next = new Set(current)
                      next.delete(index)
                      return next
                    })
                  }}
                >
                  Prøv bilde {image.id} på nytt
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div
        ref={thumbnails}
        className={styles.thumbnails}
        role='group'
        aria-label='Velg produktbilde'
        onKeyDown={event => navigate(event, true)}
        {...thumbnailSwipe}
      >
        {images.map((image, index) => (
          <button
            key={image.id}
            type='button'
            className={`${styles.thumbnail} rounded-lg`}
            aria-label={`Vis bilde ${image.id}: ${image.alt}`}
            aria-pressed={active === index}
            aria-controls='techdown-gallery-slides'
            onClick={() => select(index, true)}
          >
            <Image
              src={image.thumbnail}
              alt=''
              width={64}
              height={64}
              sizes='64px'
              quality={75}
              placeholder='empty'
              loading='lazy'
              draggable={false}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
