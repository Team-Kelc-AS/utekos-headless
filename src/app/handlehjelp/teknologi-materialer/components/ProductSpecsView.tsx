'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from 'react'
import {
  ProductLayersVisual,
  MobileProductLayersVisual
} from './ProductLayersVisual'

const ActiveTechnologyContext = createContext('')

export function useActiveTechnology() {
  return useContext(ActiveTechnologyContext)
}

export function ProductSpecsView({
  children,
  initialTechnology
}: {
  children: ReactNode
  initialTechnology: string
}) {
  const [activeTech, setActiveTech] = useState(initialTechnology)

  useEffect(() => {
    const handleIntersect = (
      entries: IntersectionObserverEntry[]
    ) => {
      entries.forEach(entry => {
        const title = entry.target.getAttribute(
          'data-tech-title'
        )
        if (!title) return

        if (entry.isIntersecting) {
          setActiveTech(title)
        }
      })
    }

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '-45% 0px -45% 0px',
      threshold: 0
    })

    const elements = document.querySelectorAll(
      '[data-tech-title]'
    )
    elements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <ActiveTechnologyContext.Provider value={activeTech}>
      <div className='mt-24 grid grid-cols-1 gap-16 lg:grid-cols-2'>
        <div className='lg:hidden'>
          <MobileProductLayersVisual activeTech={activeTech} />
        </div>

        <div className='hidden lg:block'>
          <div className='sticky top-32'>
            <ProductLayersVisual activeTech={activeTech} />
          </div>
        </div>

        <div className='space-y-24 pb-24'>{children}</div>
      </div>
    </ActiveTechnologyContext.Provider>
  )
}
