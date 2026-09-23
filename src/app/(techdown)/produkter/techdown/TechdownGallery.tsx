'use client'

import Image from 'next/image'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent
} from 'react'
import { techdownImages as images } from './techdownImages'
import styles from './TechdownGallery.module.css'

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
          if (entry.intersectionRatio >= 0.6) select(index)
        }
      },
      { root, threshold: [0, 0.01, 0.6] }
    )
    for (const slide of root.children) observer.observe(slide)
    const resize = new ResizeObserver(() => {
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
        aria-label='Hovedbilder. Sveip eller bruk piltastene for å bytte bilde.'
        onKeyDown={event => navigate(event)}
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
            inert={active !== index}
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
